# Clinical Trial Managment Using Blockchain Technology
This platform simplifies the recruitment process of clinical trials by allowing faster communication between patients and representatives of pharmaceutical institutions. Patients can securely upload their medical records and grant access to medical professionals.

## Requirements
Make sure that you have the following software installed:
- Python 3.5
- IPFS
- MetaMask for at least one browser
- pyUmbral
- NPM
- Ganache

## Setup
Clone the repository and navigate into its main directory.
Install the requirements:
```
sudo npm install
```

## How to start it
Start the Ganache blockchain

Initialize the smart contracts:
```
cd truffle
truffle migrate
```
Troubleshooting: delete the `truffle/build` directory.

Start the IPFS daemon

From the main directory, start the key management system:
```
sudo python kms_server.py
```

Start the web server:
```
sudo npm run dev
```
This should open the platform in your default browser.

Use MetaMask to connect to the Ganache blockchain.


## Test the Smart Contract
```
cd truffle
truffle test
```

