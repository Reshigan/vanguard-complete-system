const db = require('../config/mockDatabase');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const blockchainService = require('../services/blockchainService');
const { v4: uuidv4 } = require('uuid');

const validateToken = async (req, res) => {
  try {
    const { tokenHash, location, deviceInfo } = req.body;

    if (!tokenHash) {
      return res.status(400).json({
        success: false,
        error: 'Token hash is required'
      });
    }

    // Find token in database
    const token = await db('nfc_tokens')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .join('manufacturers', 'nfc_tokens.manufacturer_id', 'manufacturers.id')
      .select(
        'nfc_tokens.*',
        'products.name as product_name',
        'products.category',
        'products.alcohol_content',
        'products.volume',
        'manufacturers.name as manufacturer_name'
      )
      .where('nfc_tokens.token_hash', tokenHash)
      .first();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
        isCounterfeit: true
      });
    }

    // Check if token has already been validated
    if (token.status === 'validated') {
      // Log potential counterfeit attempt
      await db('counterfeit_reports').insert({
        id: uuidv4(),
        token_id: token.id,
        reporter_id: req.user?.id || null,
        location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
        description: 'Token already validated - potential counterfeit detected',
        status: 'pending',
        created_at: new Date()
      });

      return res.status(200).json({
        success: false,
        error: 'Token has already been validated. This may be a counterfeit product.',
        isCounterfeit: true,
        token: {
          id: token.id,
          productName: token.product_name,
          manufacturer: token.manufacturer_name,
          validatedAt: token.validated_at
        }
      });
    }

    // Check if token is expired
    if (token.expiry_date && new Date(token.expiry_date) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Token has expired',
        token: {
          id: token.id,
          productName: token.product_name,
          manufacturer: token.manufacturer_name,
          expiryDate: token.expiry_date
        }
      });
    }

    // Verify blockchain signature (if available)
    if (token.blockchain_tx_hash) {
      const isValidOnChain = await blockchainService.verifyToken(token.blockchain_tx_hash, tokenHash);
      if (!isValidOnChain) {
        return res.status(400).json({
          success: false,
          error: 'Token failed blockchain verification',
          isCounterfeit: true
        });
      }
    }

    // Token is valid - return success but don't mark as validated yet
    // The client needs to physically destroy the NFC tag to complete validation
    res.status(200).json({
      success: true,
      message: 'Token is authentic. Please tear the NFC sticker to complete validation.',
      token: {
        id: token.id,
        productName: token.product_name,
        manufacturer: token.manufacturer_name,
        category: token.category,
        alcoholContent: token.alcohol_content,
        volume: token.volume,
        batchNumber: token.batch_number,
        productionDate: token.production_date,
        expiryDate: token.expiry_date,
        status: token.status
      },
      requiresPhysicalValidation: true
    });

    // Log validation attempt
    await db('supply_chain_events').insert({
      id: uuidv4(),
      token_id: token.id,
      event_type: 'validation_attempt',
      stakeholder_id: req.user?.id || null,
      stakeholder_type: 'consumer',
      location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
      metadata: { deviceInfo },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token validation'
    });
  }
};

const invalidateToken = async (req, res) => {
  try {
    const { tokenHash, location, photos } = req.body;

    if (!tokenHash) {
      return res.status(400).json({
        success: false,
        error: 'Token hash is required'
      });
    }

    const token = await db('nfc_tokens')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .join('manufacturers', 'nfc_tokens.manufacturer_id', 'manufacturers.id')
      .select(
        'nfc_tokens.*',
        'products.name as product_name',
        'manufacturers.name as manufacturer_name'
      )
      .where('nfc_tokens.token_hash', tokenHash)
      .first();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    if (token.status === 'validated') {
      return res.status(400).json({
        success: false,
        error: 'Token has already been validated'
      });
    }

    // Update token status to validated
    await db('nfc_tokens')
      .where('id', token.id)
      .update({
        status: 'validated',
        validated_at: new Date(),
        validated_location: location ? `POINT(${location.longitude} ${location.latitude})` : null
      });

    // Record supply chain event
    await db('supply_chain_events').insert({
      id: uuidv4(),
      token_id: token.id,
      event_type: 'validation',
      stakeholder_id: req.user?.id || null,
      stakeholder_type: 'consumer',
      location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
      metadata: { photos },
      timestamp: new Date()
    });

    // Award rewards to user if authenticated
    if (req.user) {
      await db('users')
        .where('id', req.user.id)
        .increment('rewards_balance', 10); // 10 points for successful validation
    }

    res.status(200).json({
      success: true,
      message: 'Token successfully validated and invalidated',
      token: {
        id: token.id,
        productName: token.product_name,
        manufacturer: token.manufacturer_name,
        validatedAt: new Date()
      },
      rewardsEarned: req.user ? 10 : 0
    });

  } catch (error) {
    logger.error('Token invalidation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token invalidation'
    });
  }
};

const getTokenInfo = async (req, res) => {
  try {
    const { tokenHash } = req.params;

    const token = await db('nfc_tokens')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .join('manufacturers', 'nfc_tokens.manufacturer_id', 'manufacturers.id')
      .select(
        'nfc_tokens.id',
        'nfc_tokens.batch_number',
        'nfc_tokens.production_date',
        'nfc_tokens.expiry_date',
        'nfc_tokens.status',
        'products.name as product_name',
        'products.category',
        'products.description',
        'manufacturers.name as manufacturer_name',
        'manufacturers.country'
      )
      .where('nfc_tokens.token_hash', tokenHash)
      .first();

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    logger.error('Get token info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getTokenHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const events = await db('supply_chain_events')
      .join('users', 'supply_chain_events.stakeholder_id', 'users.id')
      .select(
        'supply_chain_events.*',
        'users.email as stakeholder_email'
      )
      .where('supply_chain_events.token_id', id)
      .orderBy('supply_chain_events.timestamp', 'desc');

    res.status(200).json({
      success: true,
      events
    });

  } catch (error) {
    logger.error('Get token history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const createBatchTokens = async (req, res) => {
  try {
    const { productId, quantity, batchNumber, productionDate, expiryDate } = req.body;

    if (!productId || !quantity || !batchNumber) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, quantity, and batch number are required'
      });
    }

    // Verify user owns the product
    const product = await db('products')
      .where('id', productId)
      .andWhere('manufacturer_id', req.user.manufacturer_id)
      .first();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied'
      });
    }

    const tokens = [];
    const batchSize = 100; // Process in batches to avoid memory issues

    for (let i = 0; i < quantity; i += batchSize) {
      const currentBatch = [];
      const currentBatchSize = Math.min(batchSize, quantity - i);

      for (let j = 0; j < currentBatchSize; j++) {
        const tokenId = uuidv4();
        const tokenHash = crypto.createHash('sha256')
          .update(`${tokenId}-${batchNumber}-${Date.now()}-${Math.random()}`)
          .digest('hex');

        currentBatch.push({
          id: tokenId,
          token_hash: tokenHash,
          product_id: productId,
          manufacturer_id: req.user.manufacturer_id,
          batch_number: batchNumber,
          production_date: productionDate,
          expiry_date: expiryDate,
          status: 'active',
          created_at: new Date()
        });
      }

      await db('nfc_tokens').insert(currentBatch);
      tokens.push(...currentBatch);
    }

    // Record production event
    await db('supply_chain_events').insert({
      id: uuidv4(),
      token_id: null, // Batch event
      event_type: 'production',
      stakeholder_id: req.user.id,
      stakeholder_type: 'manufacturer',
      metadata: {
        productId,
        batchNumber,
        quantity,
        productionDate,
        expiryDate
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: `Successfully created ${quantity} tokens`,
      batchNumber,
      quantity,
      tokens: tokens.map(t => ({ id: t.id, tokenHash: t.token_hash }))
    });

  } catch (error) {
    logger.error('Create batch tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getMyTokens = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, productId } = req.query;
    const offset = (page - 1) * limit;

    let query = db('nfc_tokens')
      .join('products', 'nfc_tokens.product_id', 'products.id')
      .select(
        'nfc_tokens.*',
        'products.name as product_name',
        'products.category'
      )
      .where('nfc_tokens.manufacturer_id', req.user.manufacturer_id)
      .limit(limit)
      .offset(offset)
      .orderBy('nfc_tokens.created_at', 'desc');

    if (status) {
      query = query.where('nfc_tokens.status', status);
    }

    if (productId) {
      query = query.where('nfc_tokens.product_id', productId);
    }

    const tokens = await query;

    const totalQuery = db('nfc_tokens')
      .where('manufacturer_id', req.user.manufacturer_id)
      .count('* as count');

    if (status) {
      totalQuery.where('status', status);
    }
    if (productId) {
      totalQuery.where('product_id', productId);
    }

    const [{ count }] = await totalQuery;

    res.status(200).json({
      success: true,
      tokens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Get my tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  validateToken,
  invalidateToken,
  getTokenInfo,
  getTokenHistory,
  createBatchTokens,
  getMyTokens
};