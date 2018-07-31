# Clinical Trial Managment Using Blockchain Technology
This platform simplifies the recruitment process of clinical trials by allowing faster communication between patients and representatives of pharmaceutical institutions. Patients can securely upload their medical records and grant access to medical professionals.


<br></br>
## Requirements
Make sure that you have the following software installed:
- Python 3.5
- IPFS
- MetaMask for at least one browser
- pyUmbral
- NPM
- Ganache


<br></br>
## Setup
Clone the repository and navigate into its main directory.
Install the requirements:
```
sudo npm install
```

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
This should open the platform in your browser. You can also access it at `localhost:80`.

Use MetaMask to connect to the Ganache blockchain.


<br></br>
## Usage
First, login as a patient or medical professional by clicking the respective button. You should see a respective web page.


<br></br>
### As a Patient
Note that the following steps require to interact with MetaMask:
- Generate a key pair and store it at a save location.
- Select and upload a medical record. Examples can be found in `examples/medical records/`.
- Click "Show records" to see a list of your records. Open the link in a new window to see the encrypted content. Click "Decrypt" to see its original content.
- You can grant access to a medical professional, who already has a key pair. If not, first login as a medical professional as described below. Than enter its blockchain address into the text field and click "Grant access". In MetaMask, you can choose for which files you want to provide access rights.


<br></br>
### As a Medical Professional
Note that you need to switch your blockchain account in MetaMask to login as another user:
- Generate a key pair and store it at a save location.
- Click "Show records" to see a full list of all medical records you have access to. You can use "Decrypt" and the link in the same way as the owner of the record.


<br></br>
## Test the Smart Contract
```
cd truffle
truffle test
```
