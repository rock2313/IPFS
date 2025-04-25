const fs = require('fs');
const crypto = require('crypto');
const { Web3 } = require('web3');
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });
const web3 = new Web3('QUICKNODE ETHEREUM NODE URL')
const contractABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "x",
        "type": "string"
      }
    ],
    "name": "sendHash",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getHash",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = 'CONTRACT ADDRESS FROM REMIX';
const ipfsContract = new web3.eth.Contract(contractABI, contractAddress);

const account = web3.eth.accounts.privateKeyToAccount('PRIVATE KEY WITH ETH');
web3.eth.accounts.wallet.add(account);
const accountAddress = account.address;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


function generateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const stream = fs.createReadStream(filePath);
      const hash = crypto.createHash('sha256');
      stream.on('data', data => hash.update(data));
      stream.on('end', () => {
        const digest = hash.digest('hex');
        const mockIpfsHash = `Qm${digest.substring(0, 44)}`;
        resolve(mockIpfsHash);
      });
      stream.on('error', error => reject(error));
    } catch (error) {
      reject(error);
    }
  });
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileHash = await generateFileHash(req.file.path);
    
    console.log('File hash generated:', fileHash);
    const fileDir = path.join(__dirname, 'public', 'files');
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    const destination = path.join(fileDir, fileHash);
    fs.copyFileSync(req.file.path, destination);
    
    // Store hash in smart contract
    const gasEstimate = await ipfsContract.methods.sendHash(fileHash).estimateGas({ from: accountAddress });
    
    // Convert to appropriate gas value with buffer
    const gasWithBuffer = BigInt(Math.floor(Number(gasEstimate) * 1.2));
    // Or alternatively: const gasWithBuffer = gasEstimate * BigInt(12) / BigInt(10);
    
    const tx = await ipfsContract.methods.sendHash(fileHash).send({
      from: accountAddress,
      gas: gasWithBuffer
    });
    
    console.log('Transaction hash:', tx.transactionHash);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      fileHash: fileHash,
      transactionHash: tx.transactionHash,
      fileUrl: `/files/${fileHash}`
    });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get the current hash from the contract
app.get('/hash', async (req, res) => {
  try {
    const fileHash = await ipfsContract.methods.getHash().call();
    
    res.json({
      success: true,
      fileHash: fileHash,
      fileUrl: fileHash ? `/files/${fileHash}` : null
    });
  } catch (error) {
    console.error('Error getting hash:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve the files with their hashes as filenames
app.use('/files', express.static(path.join(__dirname, 'public', 'files')));

// Start server
app.listen(port, () => {
  console.log(`Local Hash-Ethereum app listening at http://localhost:${port}`);
});