# IPFS
# Ethereum-IPFS File Hash Storage

A web application built with Node.js that demonstrates storing file hashes on the Ethereum blockchain. This project simulates IPFS hash generation and interacts with a smart contract on the Sepolia testnet.

## Features

- Upload files and generate SHA-256 based hashes (simulating IPFS CIDs)
- Store file hashes on the Ethereum blockchain via smart contract
- Retrieve stored hashes from the blockchain
- Local file storage with direct access via hash-based URLs
- Integration with Sepolia testnet for demonstration purposes

## Project Structure

```
ethereum-ipfs/
│
├── index.js              # Main application file
├── public/               # Static web files
│   ├── index.html        # User interface
│   └── files/            # Stored files (with hashes as filenames)
├── uploads/              # Temporary upload directory
├── package.json          # Dependencies
└── README.md             # Project documentation
```

## Prerequisites

- Node.js v16+
- npm or yarn
- Sepolia testnet account with ETH
- QuickNode or similar HTTP NODE PROVIDER FOR SEPOLIA

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ethereum-ipfs.git
   cd ethereum-ipfs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create necessary directories:
   ```bash
   mkdir -p public/files uploads
   ```

4. Edit `index.js` to insert your Ethereum private key and contract address:
   ```javascript
   const web3 = new Web3('YOUR_ETHEREUM_NODE_URL');
   const contractAddress = 'YOUR_CONTRACT_ADDRESS';
   const account = web3.eth.accounts.privateKeyToAccount('YOUR_PRIVATE_KEY');
   ```

5. Start the application:
   ```bash
   node index.js
   ```

6. Access the application at http://localhost:3000

## Dependencies

The application uses the following main dependencies:

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "multer": "^1.4.5-lts.2",
    "web3": "^4.16.0"
  }
}
```

## Smart Contract

The application uses a simple Ethereum smart contract with the following interface(Can be compiled in Remix):

```solidity
pragma solidity ^0.8.0;

contract HashStorage {
    string private storedHash;
    
    function sendHash(string memory x) public {
        storedHash = x;
    }
    
    function getHash() public view returns (string memory) {
        return storedHash;
    }
}
```
Copy the ABI and Contrct address

## Hash Generation

The application uses a SHA-256 algorithm to simulate IPFS hash generation:

```javascript
function generateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Create a readable stream of the file
      const stream = fs.createReadStream(filePath);
      const hash = crypto.createHash('sha256');
      
      // Handle stream events
      stream.on('data', data => hash.update(data));
      stream.on('end', () => {
        // Get the hash digest in hex format
        const digest = hash.digest('hex');
        // Add Qm prefix to make it look like an IPFS hash
        const mockIpfsHash = `Qm${digest.substring(0, 44)}`;
        resolve(mockIpfsHash);
      });
      stream.on('error', error => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}
```

This function:
1. Streams the file content to avoid memory issues with large files
2. Creates a SHA-256 hash of the content
3. Formats it with a "Qm" prefix to resemble an IPFS CIDv0

## Usage Guide

### Uploading a File

1. Open the application in a web browser
2. Click the "Choose File" button to select a file
3. Click "Generate Hash & Store" to process the file
4. The application will:
   - Generate a hash for the file
   - Store the file locally with the hash as its filename
   - Send the hash to the Ethereum smart contract
   - Return details including transaction hash and file URL

### Retrieving the Current Hash

1. Click the "Get Current Hash" button
2. The application will:
   - Retrieve the most recent hash from the smart contract
   - Display the hash and a link to access the file (if available locally)

## Web3.js Integration Notes

This project uses Web3.js v4.x, which handles numeric values as BigInt. When working with gas calculations:

```javascript
// Correct way to handle gas calculations with BigInt
const gasEstimate = await ipfsContract.methods.sendHash(fileHash).estimateGas({ from: accountAddress });
const gasWithBuffer = BigInt(Math.floor(Number(gasEstimate) * 1.2));

const tx = await ipfsContract.methods.sendHash(fileHash).send({
  from: accountAddress,
  gas: gasWithBuffer
});
```

## Security Considerations

- This is a demonstration project and not intended for production use
- Private keys are hardcoded in the example; use environment variables in production
- The application simulates IPFS but does not implement actual distributed file storage
- The smart contract is a simple example and lacks access controls
