App = {
    web3Provider: null,
    contracts: {},

    init: function () {
        console.log('init');
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
        console.log('init contract');
        $.getJSON('MedicalRecordSystem.json', function (data) {
            App.contracts.MedicalRecordSystem = TruffleContract(data);
            App.contracts.MedicalRecordSystem.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        console.log('bind');
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
        console.log('upload');
        event.preventDefault();

        const fileName = $(event.target).data('fileName');

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

console.log('init1');
$(function () {
    $(window).load(function () {
        console.log('init2');
        App.init();
    });
});
