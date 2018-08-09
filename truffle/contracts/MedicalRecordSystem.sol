pragma solidity ^0.4.22;

contract MedicalRecordSystem {
    mapping(address => string[]) public records;
    mapping(address => string)   public publicKeys;
    mapping(address => mapping(bytes32 => string)) public reKeys;

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


    function addReKey(address recipient, string fileHash, string reKey) public returns (bool) {
        address sender = msg.sender;
        records[recipient] += records[sender];
        bytes32 fileHashBytes = stringToBytes32(fileHash);
        reKeys[recipient][fileHashBytes] = reKey;
        return true;
    }

    function getReKey(string fileHash) public view returns (string) {
        address patient = msg.sender;
        bytes32 fileHashBytes = stringToBytes32(fileHash);
        return reKeys[patient][fileHashBytes];
    }


    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        // https://ethereum.stackexchange.com/a/9152
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
}
