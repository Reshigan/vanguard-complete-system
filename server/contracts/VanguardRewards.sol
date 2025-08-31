// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract VanguardRewards is ERC20, Ownable, ReentrancyGuard {
    // Reward rates
    uint256 public constant VALIDATION_REWARD = 10 * 10**18; // 10 tokens
    uint256 public constant COUNTERFEIT_REPORT_REWARD = 50 * 10**18; // 50 tokens
    uint256 public constant ACHIEVEMENT_BONUS = 100 * 10**18; // 100 tokens
    
    // Tracking
    mapping(address => uint256) public validationCount;
    mapping(address => uint256) public reportCount;
    mapping(address => mapping(string => bool)) public achievements;
    mapping(address => uint256) public lastValidationTime;
    mapping(address => uint256) public streakCount;
    
    // Events
    event ValidationRewarded(address indexed user, uint256 amount, uint256 totalValidations);
    event ReportRewarded(address indexed user, uint256 amount, uint256 totalReports);
    event AchievementUnlocked(address indexed user, string achievement, uint256 bonus);
    event StreakBonus(address indexed user, uint256 streakDays, uint256 bonus);
    
    // Authorized validators (backend servers)
    mapping(address => bool) public authorizedValidators;
    
    modifier onlyValidator() {
        require(authorizedValidators[msg.sender], "Not authorized validator");
        _;
    }
    
    constructor() ERC20("Vanguard Points", "VGP") {
        // Mint initial supply to contract for rewards
        _mint(address(this), 1000000000 * 10**18); // 1 billion tokens
    }
    
    function addValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = true;
    }
    
    function removeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = false;
    }
    
    function rewardValidation(address user) external onlyValidator nonReentrant {
        // Update validation count
        validationCount[user]++;
        
        // Check and update streak
        uint256 currentTime = block.timestamp;
        uint256 lastTime = lastValidationTime[user];
        
        if (lastTime > 0) {
            uint256 timeDiff = currentTime - lastTime;
            if (timeDiff <= 86400) { // Within 24 hours
                streakCount[user]++;
                
                // Streak bonuses
                if (streakCount[user] == 7) {
                    _transfer(address(this), user, 50 * 10**18);
                    emit StreakBonus(user, 7, 50 * 10**18);
                } else if (streakCount[user] == 30) {
                    _transfer(address(this), user, 200 * 10**18);
                    emit StreakBonus(user, 30, 200 * 10**18);
                }
            } else if (timeDiff > 172800) { // More than 48 hours
                streakCount[user] = 1; // Reset streak
            }
        } else {
            streakCount[user] = 1;
        }
        
        lastValidationTime[user] = currentTime;
        
        // Transfer reward
        _transfer(address(this), user, VALIDATION_REWARD);
        
        // Check achievements
        checkValidationAchievements(user);
        
        emit ValidationRewarded(user, VALIDATION_REWARD, validationCount[user]);
    }
    
    function rewardCounterfeitReport(address user) external onlyValidator nonReentrant {
        reportCount[user]++;
        
        // Transfer reward
        _transfer(address(this), user, COUNTERFEIT_REPORT_REWARD);
        
        // Check achievements
        checkReportAchievements(user);
        
        emit ReportRewarded(user, COUNTERFEIT_REPORT_REWARD, reportCount[user]);
    }
    
    function checkValidationAchievements(address user) internal {
        uint256 count = validationCount[user];
        
        if (count == 1 && !achievements[user]["first_validation"]) {
            achievements[user]["first_validation"] = true;
            _transfer(address(this), user, ACHIEVEMENT_BONUS);
            emit AchievementUnlocked(user, "first_validation", ACHIEVEMENT_BONUS);
        }
        
        if (count == 100 && !achievements[user]["centurion"]) {
            achievements[user]["centurion"] = true;
            _transfer(address(this), user, ACHIEVEMENT_BONUS * 5);
            emit AchievementUnlocked(user, "centurion", ACHIEVEMENT_BONUS * 5);
        }
        
        if (count == 1000 && !achievements[user]["validator_master"]) {
            achievements[user]["validator_master"] = true;
            _transfer(address(this), user, ACHIEVEMENT_BONUS * 10);
            emit AchievementUnlocked(user, "validator_master", ACHIEVEMENT_BONUS * 10);
        }
    }
    
    function checkReportAchievements(address user) internal {
        uint256 count = reportCount[user];
        
        if (count == 1 && !achievements[user]["first_report"]) {
            achievements[user]["first_report"] = true;
            _transfer(address(this), user, ACHIEVEMENT_BONUS);
            emit AchievementUnlocked(user, "first_report", ACHIEVEMENT_BONUS);
        }
        
        if (count == 10 && !achievements[user]["counterfeit_hunter"]) {
            achievements[user]["counterfeit_hunter"] = true;
            _transfer(address(this), user, ACHIEVEMENT_BONUS * 3);
            emit AchievementUnlocked(user, "counterfeit_hunter", ACHIEVEMENT_BONUS * 3);
        }
        
        if (count == 50 && !achievements[user]["guardian"]) {
            achievements[user]["guardian"] = true;
            _transfer(address(this), user, ACHIEVEMENT_BONUS * 10);
            emit AchievementUnlocked(user, "guardian", ACHIEVEMENT_BONUS * 10);
        }
    }
    
    // Allow users to check their stats
    function getUserStats(address user) external view returns (
        uint256 balance,
        uint256 validations,
        uint256 reports,
        uint256 currentStreak,
        uint256 lastValidation
    ) {
        return (
            balanceOf(user),
            validationCount[user],
            reportCount[user],
            streakCount[user],
            lastValidationTime[user]
        );
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = balanceOf(address(this));
        _transfer(address(this), owner(), balance);
    }
    
    // Prevent accidental ETH transfers
    receive() external payable {
        revert("Contract does not accept ETH");
    }
}

contract VanguardNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    // NFT metadata
    mapping(uint256 => string) public tokenMetadata;
    mapping(address => mapping(string => bool)) public hasBadge;
    
    // Badge types
    string[] public badgeTypes = [
        "early_adopter",
        "counterfeit_buster",
        "supply_chain_hero",
        "brand_ambassador",
        "security_expert"
    ];
    
    event BadgeAwarded(address indexed user, string badgeType, uint256 tokenId);
    
    constructor() ERC721("Vanguard Achievement Badges", "VAB") {}
    
    function awardBadge(address user, string memory badgeType) external onlyOwner {
        require(!hasBadge[user][badgeType], "User already has this badge");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(user, tokenId);
        tokenMetadata[tokenId] = badgeType;
        hasBadge[user][badgeType] = true;
        
        emit BadgeAwarded(user, badgeType, tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        // In production, this would return actual metadata URI
        return string(abi.encodePacked(
            "https://api.vanguard-auth.com/badges/",
            tokenMetadata[tokenId],
            "/",
            Strings.toString(tokenId),
            ".json"
        ));
    }
}