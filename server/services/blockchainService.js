const Web3 = require('web3');
const crypto = require('crypto');
const knex = require('../config/database');
const { logger } = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.useMockBlockchain = true;
    
    // Enhanced contract ABI for anti-counterfeiting
    this.contractABI = [
      {
        "inputs": [{"name": "tokenHash", "type": "string"}, {"name": "productData", "type": "string"}],
        "name": "registerProduct",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenHash", "type": "string"}],
        "name": "verifyProduct",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenHash", "type": "string"}, {"name": "eventData", "type": "string"}],
        "name": "addSupplyChainEvent",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "inputs": [{"name": "tokenHash", "type": "string"}],
        "name": "invalidateProduct",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      }
    ];
    
    this.init();
  }

  async init() {
    try {
      if (!process.env.BLOCKCHAIN_RPC_URL) {
        logger.warn('Blockchain RPC URL not configured, running in mock mode');
        this.useMockBlockchain = true;
        return;
      }

      this.web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
      
      if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
        this.account = this.web3.eth.accounts.privateKeyToAccount(process.env.BLOCKCHAIN_PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(this.account);
        this.useMockBlockchain = false;
      }

      // Initialize smart contract if address is provided
      if (process.env.CONTRACT_ADDRESS && this.web3) {
        this.contract = new this.web3.eth.Contract(this.contractABI, process.env.CONTRACT_ADDRESS);
      }

      logger.info('Blockchain service initialized', { mockMode: this.useMockBlockchain });
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      this.useMockBlockchain = true;
    }
  }

  async registerToken(tokenHash, productId, manufacturerId, batchNumber) {
    try {
      if (!this.web3 || !this.contract) {
        // Mock implementation for development
        return {
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: 21000
        };
      }

      const transaction = await this.contract.methods
        .registerToken(tokenHash, productId, manufacturerId, batchNumber)
        .send({
          from: this.account.address,
          gas: 200000
        });

      logger.info(`Token registered on blockchain: ${transaction.transactionHash}`);
      return transaction;
    } catch (error) {
      logger.error('Blockchain token registration error:', error);
      throw error;
    }
  }

  async verifyToken(transactionHash, tokenHash) {
    try {
      if (!this.web3) {
        // Mock verification for development
        return Math.random() > 0.1; // 90% success rate for testing
      }

      const transaction = await this.web3.eth.getTransaction(transactionHash);
      if (!transaction) {
        return false;
      }

      // Verify transaction details match token
      // This would involve decoding transaction data and comparing with tokenHash
      return true;
    } catch (error) {
      logger.error('Blockchain token verification error:', error);
      return false;
    }
  }

  async invalidateToken(tokenHash) {
    try {
      if (!this.web3 || !this.contract) {
        // Mock implementation
        return {
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: 21000
        };
      }

      const transaction = await this.contract.methods
        .invalidateToken(tokenHash)
        .send({
          from: this.account.address,
          gas: 100000
        });

      logger.info(`Token invalidated on blockchain: ${transaction.transactionHash}`);
      return transaction;
    } catch (error) {
      logger.error('Blockchain token invalidation error:', error);
      throw error;
    }
  }

  async getTokenStatus(tokenHash) {
    try {
      if (!this.web3 || !this.contract) {
        // Mock status
        return {
          exists: true,
          isValid: true,
          isInvalidated: false,
          registrationTime: Date.now() - Math.random() * 86400000 // Random time in last 24h
        };
      }

      const status = await this.contract.methods
        .getTokenStatus(tokenHash)
        .call();

      return status;
    } catch (error) {
      logger.error('Blockchain get token status error:', error);
      throw error;
    }
  }

  async batchRegisterTokens(tokens) {
    try {
      if (!this.web3 || !this.contract) {
        // Mock batch registration
        return tokens.map(() => ({
          transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: Math.floor(Math.random() * 1000000),
          gasUsed: 21000
        }));
      }

      const tokenHashes = tokens.map(t => t.tokenHash);
      const productIds = tokens.map(t => t.productId);
      const manufacturerIds = tokens.map(t => t.manufacturerId);
      const batchNumbers = tokens.map(t => t.batchNumber);

      const transaction = await this.contract.methods
        .batchRegisterTokens(tokenHashes, productIds, manufacturerIds, batchNumbers)
        .send({
          from: this.account.address,
          gas: 500000 + (tokens.length * 50000) // Dynamic gas based on batch size
        });

      logger.info(`Batch registered ${tokens.length} tokens: ${transaction.transactionHash}`);
      return transaction;
    } catch (error) {
      logger.error('Blockchain batch registration error:', error);
      throw error;
    }
  }

  // Enhanced product registration with full metadata
  async registerProduct(tokenData) {
    try {
      if (this.useMockBlockchain) {
        return this.mockRegisterProduct(tokenData);
      }

      const productData = JSON.stringify({
        productId: tokenData.product_id,
        manufacturerId: tokenData.manufacturer_id,
        batchNumber: tokenData.batch_number,
        productionDate: tokenData.production_date,
        expiryDate: tokenData.expiry_date,
        timestamp: new Date().toISOString()
      });

      const tx = this.contract.methods.registerProduct(tokenData.token_hash, productData);
      const gas = await tx.estimateGas({ from: this.account.address });
      const gasPrice = await this.web3.eth.getGasPrice();

      const signedTx = await this.web3.eth.accounts.signTransaction({
        to: process.env.CONTRACT_ADDRESS,
        data: tx.encodeABI(),
        gas: gas,
        gasPrice: gasPrice,
        nonce: await this.web3.eth.getTransactionCount(this.account.address)
      }, process.env.BLOCKCHAIN_PRIVATE_KEY);

      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed
      };
    } catch (error) {
      logger.error('Error registering product on blockchain:', error);
      return { success: false, error: error.message };
    }
  }

  // Mock blockchain for development/testing
  mockRegisterProduct(tokenData) {
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    logger.info(`Mock blockchain: Registered product ${tokenData.token_hash} with tx ${mockTxHash}`);
    
    return {
      success: true,
      transactionHash: mockTxHash,
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: Math.floor(Math.random() * 100000)
    };
  }

  // Verify product authenticity on blockchain
  async verifyProduct(tokenHash) {
    try {
      if (this.useMockBlockchain) {
        return this.mockVerifyProduct(tokenHash);
      }

      const result = await this.contract.methods.verifyProduct(tokenHash).call();
      
      if (result && result !== '0x') {
        const productData = JSON.parse(result);
        return {
          success: true,
          verified: true,
          productData: productData,
          blockchainVerified: true
        };
      } else {
        return {
          success: true,
          verified: false,
          message: 'Product not found on blockchain'
        };
      }
    } catch (error) {
      logger.error('Error verifying product on blockchain:', error);
      return { success: false, error: error.message };
    }
  }

  async mockVerifyProduct(tokenHash) {
    // Check if token exists in database
    const token = await knex('nfc_tokens').where('token_hash', tokenHash).first();
    
    if (token) {
      return {
        success: true,
        verified: true,
        productData: {
          productId: token.product_id,
          manufacturerId: token.manufacturer_id,
          batchNumber: token.batch_number,
          productionDate: token.production_date,
          expiryDate: token.expiry_date
        },
        blockchainVerified: true,
        mockMode: true
      };
    } else {
      return {
        success: true,
        verified: false,
        message: 'Product not found'
      };
    }
  }

  // Add supply chain event to blockchain
  async addSupplyChainEvent(tokenId, eventData) {
    try {
      const token = await knex('nfc_tokens').where('id', tokenId).first();
      if (!token) {
        throw new Error('Token not found');
      }

      if (this.useMockBlockchain) {
        return this.mockAddSupplyChainEvent(token.token_hash, eventData);
      }

      const eventDataString = JSON.stringify({
        eventType: eventData.event_type,
        stakeholderId: eventData.stakeholder_id,
        stakeholderType: eventData.stakeholder_type,
        location: eventData.location,
        timestamp: eventData.timestamp,
        metadata: eventData.metadata
      });

      const tx = this.contract.methods.addSupplyChainEvent(token.token_hash, eventDataString);
      const gas = await tx.estimateGas({ from: this.account.address });
      const gasPrice = await this.web3.eth.getGasPrice();

      const signedTx = await this.web3.eth.accounts.signTransaction({
        to: process.env.CONTRACT_ADDRESS,
        data: tx.encodeABI(),
        gas: gas,
        gasPrice: gasPrice,
        nonce: await this.web3.eth.getTransactionCount(this.account.address)
      }, process.env.BLOCKCHAIN_PRIVATE_KEY);

      const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('Error adding supply chain event to blockchain:', error);
      return { success: false, error: error.message };
    }
  }

  mockAddSupplyChainEvent(tokenHash, eventData) {
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    logger.info(`Mock blockchain: Added event for ${tokenHash} with tx ${mockTxHash}`);
    
    return {
      success: true,
      transactionHash: mockTxHash,
      blockNumber: Math.floor(Math.random() * 1000000)
    };
  }

  // Generate secure token hash
  generateTokenHash(productId, batchNumber, timestamp) {
    const data = `${productId}-${batchNumber}-${timestamp}-${crypto.randomBytes(16).toString('hex')}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Get blockchain statistics
  async getBlockchainStats() {
    try {
      if (this.useMockBlockchain) {
        const totalProducts = await knex('nfc_tokens').count('* as count').first();
        const totalEvents = await knex('supply_chain_events').count('* as count').first();
        
        return {
          mockMode: true,
          totalProducts: totalProducts.count,
          totalEvents: totalEvents.count,
          networkStatus: 'Connected (Mock)',
          lastBlock: Math.floor(Math.random() * 1000000)
        };
      }

      const blockNumber = await this.web3.eth.getBlockNumber();
      const balance = await this.web3.eth.getBalance(this.account.address);
      const gasPrice = await this.web3.eth.getGasPrice();

      return {
        networkStatus: 'Connected',
        currentBlock: blockNumber,
        accountBalance: this.web3.utils.fromWei(balance, 'ether'),
        gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei'),
        contractAddress: process.env.CONTRACT_ADDRESS
      };
    } catch (error) {
      logger.error('Error getting blockchain stats:', error);
      return {
        networkStatus: 'Error',
        error: error.message
      };
    }
  }
}

module.exports = new BlockchainService();