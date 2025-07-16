// Create function using ethers.js to store hash on smart contract from .env variables

const { ethers } = require("ethers");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = JSON.parse(process.env.CONTRACT_ABI || "[]");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

// Store a hash on the blockchain by calling the smart contract
async function storeHashOnBlockchain(hash) {
  if (!CONTRACT_ADDRESS || !PRIVATE_KEY || !RPC_URL || !CONTRACT_ABI.length) {
    throw new Error("Missing blockchain environment variables");
  }

  // Set up provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  // Assumes the contract has a function called 'storeHash(bytes32 hash)'
  // If your function name or parameters are different, adjust accordingly
  let tx;
  try {
    tx = await contract.storeHash(hash);
    await tx.wait();
    return tx.hash;
  } catch (err) {
    throw new Error(`Failed to store hash on blockchain: ${err.message}`);
  }
}

module.exports = {
  storeHashOnBlockchain,
};
