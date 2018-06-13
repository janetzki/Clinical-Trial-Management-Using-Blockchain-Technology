pragma solidity ^0.4.17;

contract MedicalRecordSystem {
    mapping(address => string) public records;

    constructor() public {

    }

    function upload(string recordName) public returns (bool) {
        address patient = msg.sender;
        records[patient] = recordName;
        return true;
    }
}
