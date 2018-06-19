App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON('MedicalRecordSystem.json', function (data) {
            App.contracts.MedicalRecordSystem = TruffleContract(data);
            App.contracts.MedicalRecordSystem.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '.btn-upload', App.handleUpload);
        $(document).on('click', '.btn-update', App.handleUpdate);
    },

    handleUpload: function (event) {
        event.preventDefault();

        const fileHash = $('#file-upload').attr('data-hash');
        if (fileHash === undefined || fileHash === '') {
            console.error('No file selected');
            return;
        }

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            const account = accounts[0]; // Usually, there is only one account.

            App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
                return medicalRecordSystemInstance.upload(fileHash, {from: account});
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },

    handleUpdate: function (event) {
        event.preventDefault();

        App.contracts.MedicalRecordSystem.deployed().then(function (instance) {
            return instance.getNumberOfRecords.call().then(function (numberOfRecords) {
                numberOfRecords = numberOfRecords.toNumber();
                const promises = [];
                for (let i = 0; i < numberOfRecords; i++) {
                    promises.push(instance.getRecordByIndex.call(i));
                }
                Promise.all(promises).then(function (hashes) {
                    $('#records').text(hashes.toString().replace(/,/g, '\n', ));
                });
            })
        }).catch(function (err) {
            console.log(err.message);
        });
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
