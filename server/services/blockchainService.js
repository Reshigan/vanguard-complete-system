const Web3 = require('web3');
const { logger } = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.init();
  }

  async init() {
    try {
      if (!process.env.BLOCKCHAIN_RPC_URL) {
        logger.warn('Blockchain RPC URL not configured, running in mock mode');
        return;
      }

      this.web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL);
      
      if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
        this.account = this.web3.eth.accounts.privateKeyToAccount(process.env.BLOCKCHAIN_PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(this.account);
      }

      // Initialize smart contract if address is provided
      if (process.env.CONTRACT_ADDRESS) {
        // Contract ABI would be loaded here
        // this.contract = new this.web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);
      }

      logger.info('Blockchain service initialized');
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
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
}

module.exports = new BlockchainService();