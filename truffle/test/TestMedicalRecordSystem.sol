pragma solidity ^0.4.22;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/MedicalRecordSystem.sol";

contract TestMedicalRecordSystem {
    MedicalRecordSystem recordSystem = MedicalRecordSystem(DeployedAddresses.MedicalRecordSystem());

    // Test if a patient can upload a file
    function testUploadFile() public {
        string memory fileName = "medical record #1";
        bool success = recordSystem.upload(fileName);
        Assert.equal(success, true, "A patient should be able to upload a file.");
    }

    // Test if a patient can download their records
    function testDownloadFile() public {
        string memory fileName = "medical record #1";
        string memory records = recordSystem.getRecords();
        Assert.equal(records, fileName, "A patient should be able to download their records.");
    }
}
