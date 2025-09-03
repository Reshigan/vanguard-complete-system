// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VerifiAI Smart Contract
 * @dev Blockchain component for Verifi AI Anti-Counterfeiting System
 * @author Verifi AI Team
 */
contract VerifiAI is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Events
    event ManufacturerRegistered(address indexed manufacturer, string name);
    event ProductRegistered(uint256 indexed productId, address indexed manufacturer, string name);
    event TokenMinted(uint256 indexed tokenId, uint256 indexed productId, string tokenHash);
    event TokenValidated(uint256 indexed tokenId, address indexed validator, bool isAuthentic);
    event CounterfeitReported(uint256 indexed tokenId, address indexed reporter, string description);
    event RewardClaimed(address indexed user, uint256 amount, string reason);
    
    // Structs
    struct Manufacturer {
        string name;
        string website;
        string description;
        bool isVerified;
        bool isActive;
        uint256 registrationDate;
        uint256 totalProducts;
        uint256 totalTokens;
    }
    
    struct Product {
        uint256 id;
        address manufacturer;
        string name;
        string description;
        string category;
        string imageHash; // IPFS hash
        bool isActive;
        uint256 creationDate;
        uint256 totalTokens;
    }
    
    struct Token {
        uint256 id;
        uint256 productId;
        string tokenHash;
        address manufacturer;
        bool isActive;
        uint256 mintDate;
        uint256 validationCount;
        bool isReported;
    }
    
    struct Validation {
        uint256 tokenId;
        address validator;
        bool isAuthentic;
        uint256 timestamp;
        string location; // Encrypted location data
        string deviceInfo; // Encrypted device info
    }
    
    struct CounterfeitReport {
        uint256 tokenId;
        address reporter;
        string description;
        string evidence; // IPFS hash of evidence
        uint256 timestamp;
        bool isConfirmed;
        bool isResolved;
    }
    
    // State variables
    Counters.Counter private _productIdCounter;
    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _validationIdCounter;
    Counters.Counter private _reportIdCounter;
    
    mapping(address => Manufacturer) public manufacturers;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Token) public tokens;
    mapping(string => uint256) public tokenHashToId;
    mapping(uint256 => Validation) public validations;
    mapping(uint256 => CounterfeitReport) public reports;
    mapping(address => uint256) public userRewards;
    mapping(address => bool) public authorizedValidators;
    
    // Arrays for enumeration
    address[] public manufacturerList;
    uint256[] public productList;
    uint256[] public tokenList;
    uint256[] public validationList;
    uint256[] public reportList;
    
    // Constants
    uint256 public constant VALIDATION_REWARD = 50; // Reward for successful validation
    uint256 public constant REPORT_REWARD = 200; // Reward for counterfeit report
    uint256 public constant MANUFACTURER_FEE = 0.01 ether; // Fee to register as manufacturer
    
    // Modifiers
    modifier onlyManufacturer() {
        require(manufacturers[msg.sender].isActive, "Not an active manufacturer");
        _;
    }
    
    modifier onlyAuthorizedValidator() {
        require(authorizedValidators[msg.sender] || msg.sender == owner(), "Not authorized validator");
        _;
    }
    
    modifier validProduct(uint256 productId) {
        require(products[productId].isActive, "Product not active");
        _;
    }
    
    modifier validToken(uint256 tokenId) {
        require(tokens[tokenId].isActive, "Token not active");
        _;
    }
    
    constructor() {
        // Set contract deployer as authorized validator
        authorizedValidators[msg.sender] = true;
    }
    
    /**
     * @dev Register a new manufacturer
     */
    function registerManufacturer(
        string memory name,
        string memory website,
        string memory description
    ) external payable {
        require(msg.value >= MANUFACTURER_FEE, "Insufficient registration fee");
        require(!manufacturers[msg.sender].isActive, "Already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        manufacturers[msg.sender] = Manufacturer({
            name: name,
            website: website,
            description: description,
            isVerified: false,
            isActive: true,
            registrationDate: block.timestamp,
            totalProducts: 0,
            totalTokens: 0
        });
        
        manufacturerList.push(msg.sender);
        
        emit ManufacturerRegistered(msg.sender, name);
    }
    
    /**
     * @dev Register a new product
     */
    function registerProduct(
        string memory name,
        string memory description,
        string memory category,
        string memory imageHash
    ) external onlyManufacturer returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        
        _productIdCounter.increment();
        uint256 productId = _productIdCounter.current();
        
        products[productId] = Product({
            id: productId,
            manufacturer: msg.sender,
            name: name,
            description: description,
            category: category,
            imageHash: imageHash,
            isActive: true,
            creationDate: block.timestamp,
            totalTokens: 0
        });
        
        productList.push(productId);
        manufacturers[msg.sender].totalProducts++;
        
        emit ProductRegistered(productId, msg.sender, name);
        
        return productId;
    }
    
    /**
     * @dev Mint authentication tokens for a product
     */
    function mintTokens(
        uint256 productId,
        string[] memory tokenHashes
    ) external onlyManufacturer validProduct(productId) {
        require(products[productId].manufacturer == msg.sender, "Not product owner");
        require(tokenHashes.length > 0, "No tokens to mint");
        require(tokenHashes.length <= 1000, "Too many tokens in single batch");
        
        for (uint256 i = 0; i < tokenHashes.length; i++) {
            require(bytes(tokenHashes[i]).length > 0, "Empty token hash");
            require(tokenHashToId[tokenHashes[i]] == 0, "Token hash already exists");
            
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            
            tokens[tokenId] = Token({
                id: tokenId,
                productId: productId,
                tokenHash: tokenHashes[i],
                manufacturer: msg.sender,
                isActive: true,
                mintDate: block.timestamp,
                validationCount: 0,
                isReported: false
            });
            
            tokenHashToId[tokenHashes[i]] = tokenId;
            tokenList.push(tokenId);
            
            emit TokenMinted(tokenId, productId, tokenHashes[i]);
        }
        
        products[productId].totalTokens += tokenHashes.length;
        manufacturers[msg.sender].totalTokens += tokenHashes.length;
    }
    
    /**
     * @dev Validate a token
     */
    function validateToken(
        string memory tokenHash,
        bool isAuthentic,
        string memory location,
        string memory deviceInfo
    ) external onlyAuthorizedValidator returns (uint256) {
        uint256 tokenId = tokenHashToId[tokenHash];
        require(tokenId > 0, "Token not found");
        require(tokens[tokenId].isActive, "Token not active");
        
        _validationIdCounter.increment();
        uint256 validationId = _validationIdCounter.current();
        
        validations[validationId] = Validation({
            tokenId: tokenId,
            validator: msg.sender,
            isAuthentic: isAuthentic,
            timestamp: block.timestamp,
            location: location,
            deviceInfo: deviceInfo
        });
        
        validationList.push(validationId);
        tokens[tokenId].validationCount++;
        
        // Award rewards for validation
        userRewards[msg.sender] += VALIDATION_REWARD;
        
        emit TokenValidated(tokenId, msg.sender, isAuthentic);
        emit RewardClaimed(msg.sender, VALIDATION_REWARD, "Token validation");
        
        return validationId;
    }
    
    /**
     * @dev Report a counterfeit token
     */
    function reportCounterfeit(
        string memory tokenHash,
        string memory description,
        string memory evidence
    ) external returns (uint256) {
        uint256 tokenId = tokenHashToId[tokenHash];
        require(tokenId > 0, "Token not found");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        _reportIdCounter.increment();
        uint256 reportId = _reportIdCounter.current();
        
        reports[reportId] = CounterfeitReport({
            tokenId: tokenId,
            reporter: msg.sender,
            description: description,
            evidence: evidence,
            timestamp: block.timestamp,
            isConfirmed: false,
            isResolved: false
        });
        
        reportList.push(reportId);
        tokens[tokenId].isReported = true;
        
        // Award rewards for reporting
        userRewards[msg.sender] += REPORT_REWARD;
        
        emit CounterfeitReported(tokenId, msg.sender, description);
        emit RewardClaimed(msg.sender, REPORT_REWARD, "Counterfeit report");
        
        return reportId;
    }
    
    // View functions
    function getManufacturer(address manufacturer) external view returns (Manufacturer memory) {
        return manufacturers[manufacturer];
    }
    
    function getProduct(uint256 productId) external view returns (Product memory) {
        return products[productId];
    }
    
    function getToken(uint256 tokenId) external view returns (Token memory) {
        return tokens[tokenId];
    }
    
    function getTokenByHash(string memory tokenHash) external view returns (Token memory) {
        uint256 tokenId = tokenHashToId[tokenHash];
        require(tokenId > 0, "Token not found");
        return tokens[tokenId];
    }
    
    function getTotalCounts() external view returns (
        uint256 totalManufacturers,
        uint256 totalProducts,
        uint256 totalTokens,
        uint256 totalValidations,
        uint256 totalReports
    ) {
        return (
            manufacturerList.length,
            _productIdCounter.current(),
            _tokenIdCounter.current(),
            _validationIdCounter.current(),
            _reportIdCounter.current()
        );
    }
}