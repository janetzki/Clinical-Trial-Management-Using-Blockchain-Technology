pragma solidity ^0.4.22;

contract MedicalRecordSystem {
    mapping(address => string[]) public records;
    mapping(address => string)   public publicKeys;
    mapping(address => string) public reKeys;

    function upload(string recordHash) public returns (bool) {
        address patient = msg.sender;
        records[patient].push(recordHash);
        return true;
    }

    function getNumberOfRecords() public view returns (uint) {
        address patient = msg.sender;
        return records[patient].length;
    }

    function getRecordByIndex(uint index) public view returns (string) {
        address patient = msg.sender;
        return records[patient][index];
    }


    function setPublicKey(string publicKey) public returns (bool) {
        address patient = msg.sender;
        publicKeys[patient] = publicKey;
        return true;
    }

    function getPublicKey(address person) public view returns (string) {
        return publicKeys[person];
    }


    function addReKey(address recipient, string reKey) public returns (bool) {
        address sender = msg.sender;
        records[recipient] = records[sender];
        reKeys[recipient] = reKey;
        return true;
    }

    function getReKey() public view returns (string) {
        address patient = msg.sender;
        return reKeys[patient];
    }
}
