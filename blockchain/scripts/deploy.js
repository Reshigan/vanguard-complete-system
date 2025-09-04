const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Verifi AI Smart Contract...");
  
  // Get the contract factory
  const VerifiAI = await ethers.getContractFactory("VerifiAI");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const verifiAI = await VerifiAI.deploy();
  
  // Wait for deployment to complete
  await verifiAI.waitForDeployment();
  
  const contractAddress = await verifiAI.getAddress();
  console.log("✅ VerifiAI contract deployed to:", contractAddress);
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId);
  
  // Get deployer information
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployed by:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Save deployment information
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    transactionHash: verifiAI.deploymentTransaction().hash,
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentFile);
  
  console.log("\n🎉 Deployment completed successfully!");
  
  return {
    contract: verifiAI,
    address: contractAddress,
    deploymentInfo: deploymentInfo
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;