/**
 * Vanguard Anti-Counterfeiting System - Database Backup
 * 
 * This script creates a backup of the database and uploads it to S3 (if configured).
 * It also maintains a local backup rotation.
 * 
 * It is designed to be run as a cron job.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const AWS = require('aws-sdk');
const config = require('../config');
const logger = require('../utils/logger');

// Promisify exec
const execAsync = util.promisify(exec);

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../backups');
const MAX_LOCAL_BACKUPS = 7; // Keep 7 days of local backups
const DB_NAME = 'vanguard';
const DB_USER = 'vanguard';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILENAME = `${DB_NAME}_${TIMESTAMP}.sql`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_FILENAME);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create S3 client if configured
let s3;
if (config.aws && config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.region && config.aws.bucket) {
  s3 = new AWS.S3({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region
  });
}

// Backup database
async function backupDatabase() {
  try {
    logger.info(`Creating database backup: ${BACKUP_FILENAME}`);
    
    // Create backup using pg_dump
    await execAsync(`PGPASSWORD=${config.database.password} pg_dump -h ${config.database.host} -U ${DB_USER} -d ${DB_NAME} -f ${BACKUP_PATH}`);
    
    logger.info(`Database backup created: ${BACKUP_PATH}`);
    
    // Compress backup
    await execAsync(`gzip ${BACKUP_PATH}`);
    const compressedPath = `${BACKUP_PATH}.gz`;
    
    logger.info(`Backup compressed: ${compressedPath}`);
    
    return compressedPath;
  } catch (err) {
    logger.error('Error creating database backup:', err);
    throw err;
  }
}

// Upload backup to S3
async function uploadToS3(filePath) {
  if (!s3) {
    logger.info('S3 not configured. Skipping upload.');
    return;
  }
  
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    const params = {
      Bucket: config.aws.bucket,
      Key: `backups/database/${fileName}`,
      Body: fileContent
    };
    
    const result = await s3.upload(params).promise();
    
    logger.info(`Backup uploaded to S3: ${result.Location}`);
    
    return result.Location;
  } catch (err) {
    logger.error('Error uploading backup to S3:', err);
    throw err;
  }
}

// Rotate local backups
async function rotateLocalBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(DB_NAME) && file.endsWith('.sql.gz'))
      .map(file => path.join(BACKUP_DIR, file));
    
    // Sort by modification time (oldest first)
    files.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());
    
    // Remove oldest backups if we have more than MAX_LOCAL_BACKUPS
    if (files.length > MAX_LOCAL_BACKUPS) {
      const filesToRemove = files.slice(0, files.length - MAX_LOCAL_BACKUPS);
      
      for (const file of filesToRemove) {
        fs.unlinkSync(file);
        logger.info(`Removed old backup: ${file}`);
      }
    }
    
    logger.info(`Local backup rotation complete. Keeping ${Math.min(files.length, MAX_LOCAL_BACKUPS)} backups.`);
  } catch (err) {
    logger.error('Error rotating local backups:', err);
    throw err;
  }
}

// Main function
async function main() {
  try {
    // Backup database
    const backupPath = await backupDatabase();
    
    // Upload to S3 if configured
    if (s3) {
      await uploadToS3(backupPath);
    }
    
    // Rotate local backups
    await rotateLocalBackups();
    
    logger.info('Backup process completed successfully');
    
    process.exit(0);
  } catch (err) {
    logger.error('Backup process failed:', err);
    process.exit(1);
  }
}

// Run main function
main();