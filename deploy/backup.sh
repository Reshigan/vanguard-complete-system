#!/bin/bash

# Vanguard Backup Script
# This script performs automated backups of the database and uploads

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vanguard}"
DB_NAME="${DB_NAME:-vanguard_production}"
DB_USER="${DB_USER:-vanguard}"
DB_HOST="${DB_HOST:-localhost}"
PGPASSWORD="${DB_PASSWORD:-}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
S3_BUCKET="${AWS_S3_BACKUP_BUCKET:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)"

# Database backup
echo "Backing up database..."
export PGPASSWORD
if pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"; then
    echo -e "${GREEN}Database backup completed successfully${NC}"
else
    echo -e "${RED}Database backup failed${NC}"
    exit 1
fi

# Backup uploads directory if it exists
if [ -d "/opt/vanguard/uploads" ]; then
    echo "Backing up uploads..."
    tar -czf "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" -C /opt/vanguard uploads
    echo -e "${GREEN}Uploads backup completed successfully${NC}"
fi

# Backup ML models if they exist
if [ -d "/opt/vanguard/server/services/ml/models" ]; then
    echo "Backing up ML models..."
    tar -czf "$BACKUP_DIR/ml_models_backup_$DATE.tar.gz" -C /opt/vanguard/server/services/ml models
    echo -e "${GREEN}ML models backup completed successfully${NC}"
fi

# Clean up old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        echo "Installing AWS CLI..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip -q awscliv2.zip
        sudo ./aws/install
        rm -rf awscliv2.zip aws/
    fi
    
    # Upload files
    aws s3 cp "$BACKUP_DIR/db_backup_$DATE.sql.gz" "s3://$S3_BUCKET/database/" || true
    aws s3 cp "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" "s3://$S3_BUCKET/uploads/" || true
    aws s3 cp "$BACKUP_DIR/ml_models_backup_$DATE.tar.gz" "s3://$S3_BUCKET/ml_models/" || true
    
    # Clean up old S3 backups (keep 30 days)
    aws s3 ls "s3://$S3_BUCKET/database/" | while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "30 days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [ "$fileName" != "" ]; then
                aws s3 rm "s3://$S3_BUCKET/database/$fileName"
            fi
        fi
    done
    
    echo -e "${GREEN}S3 upload completed${NC}"
fi

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo "Backup completed at $(date)"
echo "Backup location: $BACKUP_DIR"
echo "Total backup size: $BACKUP_SIZE"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Vanguard backup completed successfully. Size: $BACKUP_SIZE\"}" \
        "$SLACK_WEBHOOK_URL"
fi

exit 0