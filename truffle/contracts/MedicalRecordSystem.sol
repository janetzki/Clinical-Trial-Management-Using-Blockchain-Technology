pragma solidity ^0.4.22;

contract MedicalRecordSystem {
    mapping(address => string) public records;

    function upload(string recordName) public returns (bool) {
        address patient = msg.sender;
        records[patient] = recordName;
        return true;
    }

    function getRecords() public view returns (string) {
        address patient = msg.sender;
        return records[patient];
    }
}
