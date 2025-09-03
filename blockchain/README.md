# Verifi AI Blockchain Component

## Overview

The Verifi AI blockchain component provides immutable product authentication and supply chain tracking using Ethereum smart contracts. This system ensures tamper-proof verification of products and creates an auditable trail of all authentication events.

## Features

- **Manufacturer Registration**: Secure on-chain registration with verification
- **Product Registration**: Immutable product catalog with metadata
- **Token Minting**: Batch creation of unique authentication tokens
- **Token Validation**: Decentralized validation with reward distribution
- **Counterfeit Reporting**: Community-driven counterfeit detection
- **Reward System**: Automatic point distribution for participation
- **Event Tracking**: Complete audit trail of all activities

## Smart Contract Architecture

### VerifiAI.sol
Main contract handling all core functionality:
- Manufacturer and product management
- Token lifecycle management
- Validation and reporting systems
- Reward distribution
- Access control and security

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Hardhat development environment
- MetaMask or similar Web3 wallet
- Testnet ETH for deployment

### Installation

1. **Install Dependencies**
```bash
cd blockchain
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

3. **Compile Contracts**
```bash
npm run compile
```

4. **Run Tests**
```bash
npm test
```

## Deployment Guide

### Local Development

1. **Start Local Blockchain**
```bash
npm run node
```

2. **Deploy to Local Network**
```bash
npm run deploy
```

### Testnet Deployment (Recommended for Testing)

1. **Deploy to Sepolia Testnet**
```bash
npm run deploy:testnet
```

2. **Verify Contract on Etherscan**
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Mainnet Deployment (Production)

⚠️ **Warning**: Mainnet deployment costs real ETH. Ensure thorough testing first.

1. **Deploy to Mainnet**
```bash
npm run deploy:mainnet
```

2. **Verify Contract**
```bash
npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
```

## Configuration

### Network Configuration

The system supports multiple networks:

- **Local**: Hardhat local blockchain (development)
- **Sepolia**: Ethereum testnet (testing)
- **Goerli**: Ethereum testnet (testing)
- **Mainnet**: Ethereum mainnet (production)
- **Polygon**: Polygon mainnet (lower fees)
- **Mumbai**: Polygon testnet (testing)

### Gas Optimization

The contracts are optimized for gas efficiency:
- Batch operations for token minting
- Efficient data structures
- Minimal storage operations
- Event-based data retrieval

## Integration with Backend

### Environment Variables

Add to your backend `.env`:
```env
# Blockchain Configuration
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_CHAIN_ID=11155111
VERIFI_AI_CONTRACT_ADDRESS=0x...
BLOCKCHAIN_PRIVATE_KEY=0x...
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ENCRYPTION_KEY=your_encryption_key_here
```

### Backend Service Integration

The blockchain service is automatically integrated with your backend API:

```javascript
const BlockchainService = require('./services/blockchain/blockchainService');
const blockchain = new BlockchainService();

// Validate a token
const result = await blockchain.validateToken(tokenHash, isAuthentic, location, deviceInfo);

// Get token information
const token = await blockchain.getTokenByHash(tokenHash);

// Get blockchain statistics
const stats = await blockchain.getStatistics();
```

## API Endpoints

The blockchain functionality is exposed through REST API endpoints:

### Token Validation
```http
POST /api/tokens/validate
Content-Type: application/json

{
  "tokenHash": "abc123...",
  "isAuthentic": true,
  "location": "New York, NY",
  "deviceInfo": "iPhone 14"
}
```

### Get Token Information
```http
GET /api/tokens/abc123.../info
```

### Blockchain Statistics
```http
GET /api/blockchain/stats
```

## Security Considerations

### Smart Contract Security

- **Access Control**: Role-based permissions for critical functions
- **Reentrancy Protection**: ReentrancyGuard for financial operations
- **Input Validation**: Comprehensive parameter validation
- **Event Logging**: Complete audit trail through events

### Data Privacy

- **Encryption**: Sensitive data encrypted before blockchain storage
- **Minimal Storage**: Only essential data stored on-chain
- **GDPR Compliance**: Personal data handled according to regulations

### Best Practices

1. **Private Key Management**
   - Never commit private keys to version control
   - Use hardware wallets for production
   - Implement key rotation policies

2. **Contract Upgrades**
   - Use proxy patterns for upgradeable contracts
   - Implement timelock for critical changes
   - Multi-signature for admin functions

3. **Monitoring**
   - Set up event monitoring
   - Track gas usage and costs
   - Monitor for unusual activity

## Cost Analysis

### Deployment Costs (Estimated)

| Network | Deployment Cost | Validation Cost | Token Minting |
|---------|----------------|-----------------|---------------|
| Sepolia | ~$0 (testnet)  | ~$0 (testnet)   | ~$0 (testnet) |
| Mainnet | ~$50-100       | ~$5-10          | ~$2-5 per token |
| Polygon | ~$0.01         | ~$0.001         | ~$0.0001 per token |

### Optimization Strategies

1. **Batch Operations**: Mint multiple tokens in single transaction
2. **Layer 2 Solutions**: Use Polygon for lower costs
3. **Gas Price Optimization**: Monitor and optimize gas prices
4. **Event-Based Storage**: Use events instead of storage when possible

## Monitoring and Analytics

### Blockchain Events

Monitor these key events:
- `ManufacturerRegistered`: New manufacturer onboarding
- `ProductRegistered`: New product additions
- `TokenMinted`: Authentication token creation
- `TokenValidated`: Product validation events
- `CounterfeitReported`: Counterfeit detection

### Analytics Dashboard

Track important metrics:
- Total validations per day/week/month
- Counterfeit detection rate
- Manufacturer activity
- Geographic distribution of validations
- Gas usage and costs

## Troubleshooting

### Common Issues

1. **Transaction Failed**
   - Check gas limit and gas price
   - Verify contract address and ABI
   - Ensure sufficient ETH balance

2. **Contract Not Found**
   - Verify deployment on correct network
   - Check contract address in configuration
   - Ensure network RPC URL is correct

3. **Permission Denied**
   - Verify account has required permissions
   - Check if manufacturer is registered and verified
   - Ensure authorized validator status

### Debug Commands

```bash
# Check contract deployment
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Get contract info
npx hardhat console --network sepolia

# Check account balance
npx hardhat run scripts/check-balance.js --network sepolia
```

## Support and Maintenance

### Regular Maintenance

1. **Monitor Contract Health**
   - Check for failed transactions
   - Monitor gas usage trends
   - Verify event emission

2. **Update Dependencies**
   - Keep Hardhat and OpenZeppelin updated
   - Monitor security advisories
   - Test updates on testnet first

3. **Backup and Recovery**
   - Backup deployment artifacts
   - Document contract addresses
   - Maintain recovery procedures

### Getting Help

- **Documentation**: Check Hardhat and OpenZeppelin docs
- **Community**: Ethereum and Polygon developer communities
- **Support**: Contact the Verifi AI development team

## Future Enhancements

### Planned Features

1. **Cross-Chain Support**: Multi-blockchain deployment
2. **NFT Integration**: Product certificates as NFTs
3. **Oracle Integration**: Real-world data feeds
4. **Governance Token**: Decentralized governance system
5. **Layer 2 Scaling**: Optimistic rollups integration

### Upgrade Path

The smart contracts are designed for future upgrades:
- Proxy pattern implementation
- Modular architecture
- Backward compatibility
- Migration tools

---

## Quick Reference

### Essential Commands
```bash
# Development
npm run compile          # Compile contracts
npm run test            # Run tests
npm run node            # Start local blockchain

# Deployment
npm run deploy          # Deploy locally
npm run deploy:testnet  # Deploy to Sepolia
npm run deploy:mainnet  # Deploy to mainnet

# Verification
npm run verify          # Verify contract
```

### Important Addresses

After deployment, save these addresses:
- **Contract Address**: Main VerifiAI contract
- **Deployer Address**: Contract owner address
- **Network**: Deployment network details

### Emergency Procedures

In case of issues:
1. Stop all API calls to blockchain service
2. Check contract status on block explorer
3. Verify network connectivity
4. Contact development team if needed

---

*For technical support or questions, please contact the Verifi AI development team.*