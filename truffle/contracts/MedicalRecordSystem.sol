pragma solidity ^0.4.22;

contract MedicalRecordSystem {
    mapping(address => string[]) public records;

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
}
