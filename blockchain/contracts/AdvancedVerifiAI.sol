// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/proxy/utils/Upgradeable.sol";

/**
 * @title AdvancedVerifiAI - Level 3 Blockchain Implementation
 * @dev Advanced anti-counterfeiting system with multi-token support, DeFi integration,
 *      cross-chain compatibility, and sophisticated governance mechanisms
 */
contract AdvancedVerifiAI is 
    ERC721, 
    ERC20, 
    ERC1155, 
    AccessControl, 
    ReentrancyGuard, 
    Pausable, 
    Upgradeable 
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Counters
    Counters.Counter private _productIds;
    Counters.Counter private _tokenIds;
    Counters.Counter private _batchIds;
    Counters.Counter private _validationIds;

    // Advanced Product Structure
    struct Product {
        uint256 id;
        address manufacturer;
        string name;
        string category;
        string description;
        uint256 price;
        string metadataURI;
        bytes32 merkleRoot; // For batch verification
        uint256 totalSupply;
        uint256 validatedCount;
        uint256 counterfeitReports;
        ProductStatus status;
        uint256 createdAt;
        mapping(uint256 => TokenData) tokens;
        mapping(address => bool) authorizedDistributors;
    }

    // Advanced Token Structure
    struct TokenData {
        uint256 tokenId;
        uint256 productId;
        uint256 batchId;
        address currentOwner;
        TokenStatus status;
        uint256 mintedAt;
        uint256 lastValidated;
        uint256 validationCount;
        bytes32 dnaHash; // Unique product DNA
        GeolocationData[] locationHistory;
        ValidationData[] validations;
        mapping(address => bool) validators;
    }

    // Batch Management
    struct BatchData {
        uint256 batchId;
        uint256 productId;
        address manufacturer;
        uint256 quantity;
        uint256 mintedCount;
        bytes32 merkleRoot;
        string ipfsHash;
        uint256 createdAt;
        BatchStatus status;
    }

    // Validation System
    struct ValidationData {
        uint256 validationId;
        uint256 tokenId;
        address validator;
        bool isAuthentic;
        uint256 confidence;
        string location;
        uint256 timestamp;
        bytes signature;
        string ipfsProof;
    }

    // Geolocation Tracking
    struct GeolocationData {
        string location;
        int256 latitude;
        int256 longitude;
        uint256 timestamp;
        address reporter;
    }

    // Counterfeit Reporting
    struct CounterfeitReport {
        uint256 reportId;
        uint256 tokenId;
        address reporter;
        string description;
        string evidence; // IPFS hash
        uint256 timestamp;
        ReportStatus status;
        uint256 reward;
        address[] validators;
        mapping(address => bool) votes;
        uint256 confirmations;
    }

    // Supply Chain Events
    struct SupplyChainEvent {
        uint256 eventId;
        uint256 tokenId;
        EventType eventType;
        address actor;
        string location;
        uint256 timestamp;
        bytes32 dataHash;
        string ipfsHash;
    }

    // Reward System
    struct RewardData {
        address user;
        uint256 totalEarned;
        uint256 totalRedeemed;
        uint256 currentBalance;
        uint256 level;
        uint256 multiplier;
        mapping(string => uint256) categoryRewards;
    }

    // Governance Proposal
    struct Proposal {
        uint256 proposalId;
        address proposer;
        string title;
        string description;
        ProposalType proposalType;
        bytes proposalData;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }

    // Enums
    enum ProductStatus { Active, Discontinued, Recalled, Suspended }
    enum TokenStatus { Minted, Validated, Suspicious, Counterfeit, Destroyed }
    enum BatchStatus { Created, Minting, Completed, Recalled }
    enum ReportStatus { Pending, Investigating, Confirmed, Rejected, Resolved }
    enum EventType { Manufactured, Shipped, Received, Sold, Validated, Reported }
    enum ProposalType { Parameter, Upgrade, Emergency, Governance }
    enum ProposalStatus { Pending, Active, Succeeded, Defeated, Executed, Cancelled }

    // State variables
    mapping(uint256 => Product) public products;
    mapping(uint256 => TokenData) public tokens;
    mapping(uint256 => BatchData) public batches;
    mapping(uint256 => ValidationData) public validations;
    mapping(uint256 => CounterfeitReport) public reports;
    mapping(uint256 => SupplyChainEvent) public supplyChainEvents;
    mapping(address => RewardData) public rewards;
    mapping(uint256 => Proposal) public proposals;
    
    // Cross-chain support
    mapping(uint256 => mapping(uint256 => bytes32)) public crossChainHashes;
    mapping(address => bool) public authorizedBridges;
    
    // Oracle integration
    mapping(address => bool) public authorizedOracles;
    mapping(bytes32 => uint256) public oracleData;
    
    // DeFi integration
    mapping(address => uint256) public stakingBalances;
    mapping(address => uint256) public stakingRewards;
    uint256 public totalStaked;
    uint256 public rewardRate;
    
    // Governance parameters
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;
    uint256 public quorumVotes;

    // Events
    event ProductRegistered(uint256 indexed productId, address indexed manufacturer, string name);
    event BatchCreated(uint256 indexed batchId, uint256 indexed productId, uint256 quantity);
    event TokenMinted(uint256 indexed tokenId, uint256 indexed productId, uint256 indexed batchId);
    event TokenValidated(uint256 indexed tokenId, address indexed validator, bool isAuthentic);
    event CounterfeitReported(uint256 indexed reportId, uint256 indexed tokenId, address indexed reporter);
    event RewardDistributed(address indexed user, uint256 amount, string reason);
    event SupplyChainEventRecorded(uint256 indexed eventId, uint256 indexed tokenId, EventType eventType);
    event CrossChainTransfer(uint256 indexed tokenId, uint256 sourceChain, uint256 targetChain);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);

    // Modifiers
    modifier onlyManufacturer(uint256 productId) {
        require(products[productId].manufacturer == msg.sender, "Not the manufacturer");
        _;
    }

    modifier onlyAuthorizedValidator() {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "Not authorized validator");
        _;
    }

    modifier onlyOracle() {
        require(hasRole(ORACLE_ROLE, msg.sender), "Not authorized oracle");
        _;
    }

    modifier validToken(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        string memory uri
    ) 
        ERC721(name, symbol)
        ERC20("VerifiAI Token", "VAI")
        ERC1155(uri)
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(GOVERNANCE_ROLE, msg.sender);
        _setupRole(EMERGENCY_ROLE, msg.sender);
        
        // Initialize governance parameters
        votingDelay = 1 days;
        votingPeriod = 7 days;
        proposalThreshold = 100000 * 10**18; // 100k tokens
        quorumVotes = 1000000 * 10**18; // 1M tokens
        rewardRate = 100; // 1% per year
        
        // Mint initial supply
        _mint(msg.sender, 100000000 * 10**18); // 100M tokens
    }

    // ============ PRODUCT MANAGEMENT ============

    /**
     * @dev Register a new product with advanced metadata
     */
    function registerProduct(
        string memory name,
        string memory category,
        string memory description,
        uint256 price,
        string memory metadataURI,
        bytes32 merkleRoot
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        _productIds.increment();
        uint256 productId = _productIds.current();
        
        Product storage product = products[productId];
        product.id = productId;
        product.manufacturer = msg.sender;
        product.name = name;
        product.category = category;
        product.description = description;
        product.price = price;
        product.metadataURI = metadataURI;
        product.merkleRoot = merkleRoot;
        product.status = ProductStatus.Active;
        product.createdAt = block.timestamp;
        
        emit ProductRegistered(productId, msg.sender, name);
        return productId;
    }

    /**
     * @dev Create a new batch for token minting
     */
    function createBatch(
        uint256 productId,
        uint256 quantity,
        bytes32 merkleRoot,
        string memory ipfsHash
    ) external onlyManufacturer(productId) returns (uint256) {
        require(products[productId].status == ProductStatus.Active, "Product not active");
        
        _batchIds.increment();
        uint256 batchId = _batchIds.current();
        
        BatchData storage batch = batches[batchId];
        batch.batchId = batchId;
        batch.productId = productId;
        batch.manufacturer = msg.sender;
        batch.quantity = quantity;
        batch.merkleRoot = merkleRoot;
        batch.ipfsHash = ipfsHash;
        batch.createdAt = block.timestamp;
        batch.status = BatchStatus.Created;
        
        emit BatchCreated(batchId, productId, quantity);
        return batchId;
    }

    /**
     * @dev Mint authentication tokens with advanced features
     */
    function mintTokens(
        uint256 batchId,
        bytes32[] memory dnaHashes,
        bytes32[] memory merkleProofs
    ) external nonReentrant {
        BatchData storage batch = batches[batchId];
        require(batch.manufacturer == msg.sender, "Not batch owner");
        require(batch.status == BatchStatus.Created, "Invalid batch status");
        require(dnaHashes.length <= batch.quantity, "Exceeds batch quantity");
        
        batch.status = BatchStatus.Minting;
        
        for (uint256 i = 0; i < dnaHashes.length; i++) {
            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();
            
            // Verify merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(tokenId, dnaHashes[i]));
            require(MerkleProof.verify(merkleProofs[i], batch.merkleRoot, leaf), "Invalid proof");
            
            // Mint NFT
            _safeMint(msg.sender, tokenId);
            
            // Initialize token data
            TokenData storage token = tokens[tokenId];
            token.tokenId = tokenId;
            token.productId = batch.productId;
            token.batchId = batchId;
            token.currentOwner = msg.sender;
            token.status = TokenStatus.Minted;
            token.mintedAt = block.timestamp;
            token.dnaHash = dnaHashes[i];
            
            // Mint ERC1155 for batch tracking
            _mint(msg.sender, batchId, 1, "");
            
            batch.mintedCount++;
            products[batch.productId].totalSupply++;
            
            emit TokenMinted(tokenId, batch.productId, batchId);
        }
        
        if (batch.mintedCount == batch.quantity) {
            batch.status = BatchStatus.Completed;
        }
    }

    // ============ VALIDATION SYSTEM ============

    /**
     * @dev Advanced token validation with ML integration
     */
    function validateToken(
        uint256 tokenId,
        bool isAuthentic,
        uint256 confidence,
        string memory location,
        bytes memory signature,
        string memory ipfsProof
    ) external onlyAuthorizedValidator validToken(tokenId) {
        require(confidence >= 50 && confidence <= 100, "Invalid confidence");
        
        _validationIds.increment();
        uint256 validationId = _validationIds.current();
        
        ValidationData storage validation = validations[validationId];
        validation.validationId = validationId;
        validation.tokenId = tokenId;
        validation.validator = msg.sender;
        validation.isAuthentic = isAuthentic;
        validation.confidence = confidence;
        validation.location = location;
        validation.timestamp = block.timestamp;
        validation.signature = signature;
        validation.ipfsProof = ipfsProof;
        
        TokenData storage token = tokens[tokenId];
        token.validations.push(validation);
        token.lastValidated = block.timestamp;
        token.validationCount++;
        token.validators[msg.sender] = true;
        
        if (isAuthentic) {
            token.status = TokenStatus.Validated;
            products[token.productId].validatedCount++;
        } else {
            token.status = TokenStatus.Suspicious;
        }
        
        // Distribute rewards
        _distributeValidationReward(msg.sender, isAuthentic, confidence);
        
        emit TokenValidated(tokenId, msg.sender, isAuthentic);
    }

    /**
     * @dev Batch validation for efficiency
     */
    function batchValidate(
        uint256[] memory tokenIds,
        bool[] memory authenticity,
        uint256[] memory confidences,
        string[] memory locations,
        bytes[] memory signatures
    ) external onlyAuthorizedValidator {
        require(tokenIds.length == authenticity.length, "Array length mismatch");
        require(tokenIds.length <= 100, "Batch too large");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            validateToken(
                tokenIds[i],
                authenticity[i],
                confidences[i],
                locations[i],
                signatures[i],
                ""
            );
        }
    }

    // ============ COUNTERFEIT REPORTING ============

    /**
     * @dev Report counterfeit with evidence
     */
    function reportCounterfeit(
        uint256 tokenId,
        string memory description,
        string memory evidence
    ) external validToken(tokenId) returns (uint256) {
        Counters.Counter storage _reportIds = _getReportCounter();
        _reportIds.increment();
        uint256 reportId = _reportIds.current();
        
        CounterfeitReport storage report = reports[reportId];
        report.reportId = reportId;
        report.tokenId = tokenId;
        report.reporter = msg.sender;
        report.description = description;
        report.evidence = evidence;
        report.timestamp = block.timestamp;
        report.status = ReportStatus.Pending;
        
        tokens[tokenId].status = TokenStatus.Suspicious;
        products[tokens[tokenId].productId].counterfeitReports++;
        
        emit CounterfeitReported(reportId, tokenId, msg.sender);
        return reportId;
    }

    /**
     * @dev Validate counterfeit report
     */
    function validateReport(
        uint256 reportId,
        bool isValid
    ) external onlyAuthorizedValidator {
        CounterfeitReport storage report = reports[reportId];
        require(report.status == ReportStatus.Pending, "Report already processed");
        require(!report.votes[msg.sender], "Already voted");
        
        report.votes[msg.sender] = isValid;
        report.validators.push(msg.sender);
        
        if (isValid) {
            report.confirmations++;
        }
        
        // Require 3 confirmations for counterfeit confirmation
        if (report.confirmations >= 3) {
            report.status = ReportStatus.Confirmed;
            tokens[report.tokenId].status = TokenStatus.Counterfeit;
            
            // Distribute reward to reporter
            uint256 reward = calculateCounterfeitReward(report.tokenId);
            _distributeReward(report.reporter, reward, "Counterfeit Report");
            report.reward = reward;
        }
    }

    // ============ SUPPLY CHAIN TRACKING ============

    /**
     * @dev Record supply chain event
     */
    function recordSupplyChainEvent(
        uint256 tokenId,
        EventType eventType,
        string memory location,
        bytes32 dataHash,
        string memory ipfsHash
    ) external validToken(tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || 
            products[tokens[tokenId].productId].authorizedDistributors[msg.sender],
            "Not authorized"
        );
        
        Counters.Counter storage _eventIds = _getEventCounter();
        _eventIds.increment();
        uint256 eventId = _eventIds.current();
        
        SupplyChainEvent storage scEvent = supplyChainEvents[eventId];
        scEvent.eventId = eventId;
        scEvent.tokenId = tokenId;
        scEvent.eventType = eventType;
        scEvent.actor = msg.sender;
        scEvent.location = location;
        scEvent.timestamp = block.timestamp;
        scEvent.dataHash = dataHash;
        scEvent.ipfsHash = ipfsHash;
        
        // Update token location history
        TokenData storage token = tokens[tokenId];
        token.locationHistory.push(GeolocationData({
            location: location,
            latitude: 0, // To be updated by oracle
            longitude: 0, // To be updated by oracle
            timestamp: block.timestamp,
            reporter: msg.sender
        }));
        
        emit SupplyChainEventRecorded(eventId, tokenId, eventType);
    }

    // ============ CROSS-CHAIN FUNCTIONALITY ============

    /**
     * @dev Initiate cross-chain transfer
     */
    function initiateCrossChainTransfer(
        uint256 tokenId,
        uint256 targetChain,
        address targetAddress
    ) external validToken(tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(authorizedBridges[msg.sender], "Not authorized bridge");
        
        // Lock token on current chain
        _transfer(msg.sender, address(this), tokenId);
        
        // Generate cross-chain hash
        bytes32 crossChainHash = keccak256(
            abi.encodePacked(tokenId, targetChain, targetAddress, block.timestamp)
        );
        
        crossChainHashes[block.chainid][tokenId] = crossChainHash;
        
        emit CrossChainTransfer(tokenId, block.chainid, targetChain);
    }

    /**
     * @dev Complete cross-chain transfer
     */
    function completeCrossChainTransfer(
        uint256 tokenId,
        uint256 sourceChain,
        bytes32 crossChainHash,
        bytes memory signature
    ) external {
        require(authorizedBridges[msg.sender], "Not authorized bridge");
        
        // Verify cross-chain hash
        bytes32 expectedHash = crossChainHashes[sourceChain][tokenId];
        require(expectedHash == crossChainHash, "Invalid cross-chain hash");
        
        // Verify signature from source chain
        bytes32 messageHash = keccak256(abi.encodePacked(tokenId, sourceChain, crossChainHash));
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        require(authorizedBridges[signer], "Invalid signature");
        
        // Mint token on target chain
        _safeMint(msg.sender, tokenId);
        
        // Clear cross-chain hash
        delete crossChainHashes[sourceChain][tokenId];
    }

    // ============ DEFI INTEGRATION ============

    /**
     * @dev Stake tokens for rewards
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        stakingBalances[msg.sender] += amount;
        totalStaked += amount;
        
        // Mint staking NFT
        uint256 stakingTokenId = _tokenIds.current() + 1000000; // Offset for staking tokens
        _safeMint(msg.sender, stakingTokenId);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Cannot unstake 0");
        require(stakingBalances[msg.sender] >= amount, "Insufficient staked balance");
        
        // Update rewards before changing stake
        _updateRewards(msg.sender);
        
        stakingBalances[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
    }

    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external {
        _updateRewards(msg.sender);
        
        uint256 reward = stakingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        stakingRewards[msg.sender] = 0;
        _mint(msg.sender, reward);
        
        emit RewardDistributed(msg.sender, reward, "Staking Rewards");
    }

    // ============ GOVERNANCE ============

    /**
     * @dev Create governance proposal
     */
    function propose(
        string memory title,
        string memory description,
        ProposalType proposalType,
        bytes memory proposalData
    ) external returns (uint256) {
        require(balanceOf(msg.sender) >= proposalThreshold, "Insufficient tokens for proposal");
        
        Counters.Counter storage _proposalIds = _getProposalCounter();
        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();
        
        Proposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.proposalType = proposalType;
        proposal.proposalData = proposalData;
        proposal.startTime = block.timestamp + votingDelay;
        proposal.endTime = block.timestamp + votingDelay + votingPeriod;
        proposal.status = ProposalStatus.Pending;
        
        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }

    /**
     * @dev Vote on proposal
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 weight = balanceOf(msg.sender);
        require(weight > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
        
        // Check if proposal can be executed
        if (proposal.forVotes > proposal.againstVotes && 
            proposal.forVotes >= quorumVotes) {
            proposal.status = ProposalStatus.Succeeded;
        }
    }

    // ============ ORACLE INTEGRATION ============

    /**
     * @dev Update oracle data
     */
    function updateOracleData(
        bytes32 key,
        uint256 value
    ) external onlyOracle {
        oracleData[key] = value;
    }

    /**
     * @dev Get oracle data
     */
    function getOracleData(bytes32 key) external view returns (uint256) {
        return oracleData[key];
    }

    // ============ REWARD SYSTEM ============

    function _distributeValidationReward(
        address validator,
        bool isAuthentic,
        uint256 confidence
    ) internal {
        uint256 baseReward = 10 * 10**18; // 10 tokens
        uint256 confidenceBonus = (confidence * baseReward) / 100;
        uint256 authenticityBonus = isAuthentic ? baseReward / 2 : 0;
        
        uint256 totalReward = baseReward + confidenceBonus + authenticityBonus;
        
        _distributeReward(validator, totalReward, "Token Validation");
    }

    function _distributeReward(
        address user,
        uint256 amount,
        string memory reason
    ) internal {
        RewardData storage reward = rewards[user];
        reward.totalEarned += amount;
        reward.currentBalance += amount;
        
        // Update level based on total earned
        uint256 newLevel = reward.totalEarned / (1000 * 10**18); // Level up every 1000 tokens
        if (newLevel > reward.level) {
            reward.level = newLevel;
            reward.multiplier = 100 + (newLevel * 10); // 10% bonus per level
        }
        
        _mint(user, amount);
        
        emit RewardDistributed(user, amount, reason);
    }

    function calculateCounterfeitReward(uint256 tokenId) internal view returns (uint256) {
        uint256 productPrice = products[tokens[tokenId].productId].price;
        return (productPrice * 5) / 100; // 5% of product price
    }

    // ============ UTILITY FUNCTIONS ============

    function _updateRewards(address user) internal {
        uint256 stakedBalance = stakingBalances[user];
        if (stakedBalance > 0) {
            uint256 timeElapsed = block.timestamp - rewards[user].totalEarned; // Simplified
            uint256 reward = (stakedBalance * rewardRate * timeElapsed) / (365 days * 10000);
            stakingRewards[user] += reward;
        }
    }

    function _getReportCounter() internal pure returns (Counters.Counter storage) {
        // Implementation for report counter
    }

    function _getEventCounter() internal pure returns (Counters.Counter storage) {
        // Implementation for event counter
    }

    function _getProposalCounter() internal pure returns (Counters.Counter storage) {
        // Implementation for proposal counter
    }

    // ============ ADMIN FUNCTIONS ============

    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    function setRewardRate(uint256 newRate) external onlyRole(GOVERNANCE_ROLE) {
        rewardRate = newRate;
    }

    function addAuthorizedBridge(address bridge) external onlyRole(GOVERNANCE_ROLE) {
        authorizedBridges[bridge] = true;
    }

    function removeAuthorizedBridge(address bridge) external onlyRole(GOVERNANCE_ROLE) {
        authorizedBridges[bridge] = false;
    }

    // ============ VIEW FUNCTIONS ============

    function getProductInfo(uint256 productId) external view returns (
        string memory name,
        string memory category,
        address manufacturer,
        uint256 totalSupply,
        uint256 validatedCount,
        ProductStatus status
    ) {
        Product storage product = products[productId];
        return (
            product.name,
            product.category,
            product.manufacturer,
            product.totalSupply,
            product.validatedCount,
            product.status
        );
    }

    function getTokenInfo(uint256 tokenId) external view returns (
        uint256 productId,
        uint256 batchId,
        address currentOwner,
        TokenStatus status,
        uint256 validationCount,
        bytes32 dnaHash
    ) {
        TokenData storage token = tokens[tokenId];
        return (
            token.productId,
            token.batchId,
            token.currentOwner,
            token.status,
            token.validationCount,
            token.dnaHash
        );
    }

    function getRewardInfo(address user) external view returns (
        uint256 totalEarned,
        uint256 currentBalance,
        uint256 level,
        uint256 multiplier
    ) {
        RewardData storage reward = rewards[user];
        return (
            reward.totalEarned,
            reward.currentBalance,
            reward.level,
            reward.multiplier
        );
    }

    // ============ REQUIRED OVERRIDES ============

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
        
        // Update token owner
        if (tokens[tokenId].tokenId != 0) {
            tokens[tokenId].currentOwner = to;
        }
    }
}