const ipfs = new IpfsApi('localhost', '5001', {protocol: 'http'});

App = {
    web3Provider: null,
    contracts: {},
    privateKey: null,
    publicKey: null,

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
        $(document).on('click', '.btn-generate-keys', App.generateKeys);
    },

    setKeys: function(keys) {
        App.privateKey = keys['private'];
        App.publicKey = keys['public'];
        $('#privateKey').text('Private: ' + App.privateKey);
        $('#publicKey').text('Public: ' + App.publicKey);
    },

    generateKeys: function () {
        $.ajax({
            type: 'GET',
            url: 'http://localhost:8000/generate_key_pair',
            success: function (data, textStatus, jqXHR1) {
                App.setKeys(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(jqXHR.responseJSON);
                console.error(errorThrown);
            }
        });
    },

    uploadFileToIpfs: function(encryptedFile) {
        const buffer = Buffer.from(encryptedFile);
        ipfs.add(buffer, (err, ipfsHash) => {
            const fileHash = ipfsHash[0].hash;

            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.error(error);
                }

                const account = accounts[0]; // Usually, there is only one account.

                App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
                    return medicalRecordSystemInstance.upload(fileHash, {from: account});
                }).catch(function (err) {
                    console.error(err.message);
                });
            });
        });
    },

    encryptFile: function(file) {
        const data = {
            file: file,
            public_key: App.publicKey
        };
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: 'http://localhost:8000/encrypt',
            data: data,
            //contentType: 'application/json',
            success: function (data, textStatus, jqXHR1) {
                App.uploadFileToIpfs(JSON.stringify(data));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(jqXHR.responseJSON);
                console.error(errorThrown);
            }
        });
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

        reader.readAsText(file);
        reader.onload = function (reader) {
            const file = reader.target.result;
            App.encryptFile(file);
        };
    },

    getFile: function (url, callback, fileName, list) {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                callback(url, xmlHttp.responseText, fileName, list);
            }
        };
        xmlHttp.open('GET', url, true);
        xmlHttp.send(null);
    },

    decrypt: function (event) {
        const data = {
            file: event.target.getAttribute('encryptedFile'),
            public_key: App.publicKey,
            private_key: App.privateKey
        };
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: 'http://localhost:8000/decrypt',
            data: data,
            success: function (data, textStatus, jqXHR1) {
                alert(data['file'])
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(jqXHR.responseJSON);
                console.error(errorThrown);
            }
        });
    },

    showFileLink: function(url, encryptedFile, fileName, list) {
        const link = document.createElement('a');
        link.appendChild(document.createTextNode(fileName));
        link.title = fileName;
        link.href = url;

        const button = document.createElement('button');
        const idClass = 'btn-decrypt' + fileName;
        button.textContent = 'Decrypt';
        const classList = 'btn btn-default decrypt-button btn-decrypt ' + idClass;
        button.classList = classList;
        button.type = 'button';
        button.setAttribute('encryptedFile', encryptedFile);
        $(document).on('click', '.' + idClass, App.decrypt);

        const listItem = document.createElement('li');
        listItem.appendChild(button);
        listItem.appendChild(link);
        list.appendChild(listItem);
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
                    for (const i in hashes) {
                        const hash = hashes[i];
                        const url = 'http://localhost:8080/ipfs/' + hash;
                        App.getFile(url, App.showFileLink, 'Record_' + i, list);
                    }
                });
            })
        }).catch(function (err) {
            console.error(err.message);
        });
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
