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
    },

    markUploaded: function () {
        App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
            // TODO
        }).then(function () {
            // TODO
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    handleUpload: function (event) {
        event.preventDefault();

        const fileName = $(event.target).data('file-name');

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            const account = accounts[0];

            App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
                return medicalRecordSystemInstance.upload(fileName, {from: account});
            }).then(function (result) {
                return App.markUploaded();
            }).catch(function (err) {
                console.log(err.message);
            });
        });
    }

};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
