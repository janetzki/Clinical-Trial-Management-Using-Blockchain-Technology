pragma solidity ^0.4.22;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/MedicalRecordSystem.sol";

contract TestMedicalRecordSystem {
    MedicalRecordSystem recordSystem = MedicalRecordSystem(DeployedAddresses.MedicalRecordSystem());

    // Test if a patient can upload a file
    function testUploadFile() public {
        string memory hash = "12345";
        bool success = recordSystem.upload(hash);
        Assert.equal(success, true, "A patient should be able to upload a file.");
    }

    // Test if the number of records is correct
    function testNumberOfRecords() public {
        uint numberOfRecords = recordSystem.getNumberOfRecords();
        Assert.equal(numberOfRecords, 1, "The number of records should be 1.");
    }

    // Test if a patient can download their records
    function testDownloadFile() public {
        string memory hash = "12345";
        string memory record = recordSystem.getRecordByIndex(0);
        Assert.equal(record, hash, "A patient should be able to download their records.");
    }
}
