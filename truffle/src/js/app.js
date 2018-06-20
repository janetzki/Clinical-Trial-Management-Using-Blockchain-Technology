const ipfs = new IpfsApi('localhost', '5001', {protocol: 'http'});

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

        const fileUploader = $('#file-upload')[0];
        if (!fileUploader.files || !fileUploader.files[0]) {
            console.error('No file selected');
            return;
        }
        const file = fileUploader.files[0];
        const reader = new FileReader();

        reader.readAsArrayBuffer(file);
        reader.onload = function (reader) {
            const buffer = Buffer.from(reader.target.result);
            ipfs.add(buffer, (err, ipfsHash) => {
                console.log(err, ipfsHash);
                const fileHash = ipfsHash[0].hash;

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
            });
        };
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
                    const list = document.getElementById('records');
                    list.innerHTML = '';
                    for (const hash of hashes) {
                        const link = document.createElement('a');
                        link.appendChild(document.createTextNode(hash));
                        link.title = hash;
                        link.href = 'http://localhost:8080/ipfs/' + hash;

                        const listItem = document.createElement('li');
                        // listItem.appendChild(document.createTextNode(hash));
                        listItem.appendChild(link);
                        list.appendChild(listItem);
                    }
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
