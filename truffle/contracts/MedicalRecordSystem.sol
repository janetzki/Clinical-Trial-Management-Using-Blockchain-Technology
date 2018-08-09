pragma solidity ^0.4.22;

contract MedicalRecordSystem {
    mapping(address => string[]) public ownRecords;
    mapping(address => mapping(address => string[])) public foreignRecords;
    mapping(address => string) public publicKeys;
    mapping(address => mapping(bytes32 => string)) public reKeys;


    function upload(string hashPointer) public returns (bool) {
        address patient = msg.sender;
        ownRecords[patient].push(hashPointer);
        return true;
    }

    function getNumberOfRecords() public view returns (uint) {
        address patient = msg.sender;
        return ownRecords[patient].length;
    }

    function getRecordByIndex(uint index) public view returns (string) {
        address patient = msg.sender;
        return ownRecords[patient][index];
    }


    function setPublicKey(string publicKey) public returns (bool) {
        address patient = msg.sender;
        publicKeys[patient] = publicKey;
        return true;
    }

    function getPublicKey(address person) public view returns (string) {
        return publicKeys[person];
    }


    function addReKey(address medic, string hashPointer, string reKey) public returns (bool) {
        address patient = msg.sender;
        foreignRecords[medic][patient] = ownRecords[patient];
        bytes32 hashPointerBytes = stringToBytes32(hashPointer);
        reKeys[medic][hashPointerBytes] = reKey;
        return true;
    }

    function getReKey(string hashPointer) public view returns (string) {
        address medic = msg.sender;
        bytes32 hashPointerBytes = stringToBytes32(hashPointer);
        return reKeys[medic][hashPointerBytes];
    }

    function getNumberOfForeignRecords(address patient) public view returns (uint) {
        address medic = msg.sender;
        return foreignRecords[medic][patient].length;
    }

    function getForeignRecordByIndex(address patient, uint index) public view returns (string) {
        address medic = msg.sender;
        return foreignRecords[medic][patient][index];
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
