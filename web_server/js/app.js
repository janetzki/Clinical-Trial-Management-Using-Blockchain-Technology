const ipfs = new IpfsApi('localhost', '5001', {protocol: 'http'});

App = {
    web3Provider: null,
    contracts: {},
    privateKey: null,
    publicKey: null,
    files: {},

    init: function () {
        const isFirefox = typeof InstallTrigger !== 'undefined';
        if (isFirefox) {
            $('#title').text('Welcome, patient!');
            $('#body').css('background', 'linear-gradient(to bottom, #eeeeff 0%, #aaaaff 100%)');
        } else {
            $('#title').text('Welcome, doctor!');
            $('#body').css('background', 'linear-gradient(to bottom, #eeffee 0%, #aaffaa 100%)');
            $("#upload-record").css('display', 'none');
            $("#grant-access").css('display', 'none');
        }
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
        $(document).on('click', '.btn-grant-access', App.grantAccess);
    },

    grantAccess: function (event) {
        event.preventDefault();

        const account = $('#recipient-address').val();
        if (account === '') {
            // alert('Enter a valid address');
            return;
        }

        App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
            return medicalRecordSystemInstance.getPublicKey.call(account);
        }).then(function (publicKey) {
            if (publicKey === '') {
                // alert('This user does not have a public key yet.');
                return;
            }
            for (const fileHash in App.files) {
                console.log(fileHash);
                const encryptedFile = App.files[fileHash];
                const fileJson = JSON.parse(encryptedFile);
                const data = {
                    private_key: App.privateKey,
                    public_key: publicKey,
                    capsule: fileJson.capsule
                };
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: 'http://localhost:8000/grant_acess',
                    data: data,
                    success: function (data, textStatus, jqXHR1) {
                        App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
                            return medicalRecordSystemInstance.addReKey(account, fileHash, data.capsule);
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error(textStatus);
                        console.error(jqXHR.responseJSON);
                        console.error(errorThrown);
                    }
                });
            }
        }).catch(function (err) {
            console.error(err.message);
        });
    },

    setKeys: function (keys) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.error(error);
            }
            const account = accounts[0];

            App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
                return medicalRecordSystemInstance.setPublicKey(keys['public'], {from: account});
            }).then(function (result) {
                App.privateKey = keys['private'];
                App.publicKey = keys['public'];
                $('#privateKey').text('Private: ' + App.privateKey);
                $('#publicKey').text('Public: ' + App.publicKey);
            }).catch(function (err) {
                console.error(err.message);
            });
        });
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
            // alert('No file selected');
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

    getFile: function (url, callback, hash, fileName, list) {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                callback(url, xmlHttp.responseText, hash, fileName, list);
            }
        };
        xmlHttp.open('GET', url, true);
        xmlHttp.send(null);
    },

    decrypt: function (event) {
        const fileJson = JSON.parse(event.target.getAttribute('encryptedFile'));
        const fileHash = event.target.getAttribute('fileHash');
        const data = {
            file: fileJson.file,
            capsule: fileJson.capsule,
            private_key: App.privateKey,
            public_key: App.publicKey
        };

        App.contracts.MedicalRecordSystem.deployed().then(function (medicalRecordSystemInstance) {
            return medicalRecordSystemInstance.getReKey.call(fileHash);
        }).then(function (reKey) {

            if (reKey !== '') {
                // medical professional
                data.capsule = reKey;
            }
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: 'http://localhost:8000/decrypt',
                data: data,
                success: function (data, textStatus, jqXHR1) {
                    $('#record').text(data['file']);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error(textStatus);
                    console.error(jqXHR.responseJSON);
                    console.error(errorThrown);
                }
            });
        }).catch(function (err) {
            console.error(err.message);
        });
    },

    showFileLink: function(url, encryptedFile, hash, fileName, list) {
        const link = document.createElement('a');
        link.appendChild(document.createTextNode(fileName));
        link.title = fileName;
        link.href = url;

        const button = document.createElement('button');
        const idClass = 'btn-decrypt' + fileName;
        button.textContent = 'Decrypt';
        button.classList = 'btn btn-default decrypt-button btn-decrypt ' + idClass;
        button.type = 'button';
        button.setAttribute('encryptedFile', encryptedFile);
        button.setAttribute('fileHash', hash);
        $(document).on('click', '.' + idClass, App.decrypt);

        const listItem = document.createElement('li');
        listItem.appendChild(button);
        listItem.appendChild(link);
        list.appendChild(listItem);

        App.files[hash] = encryptedFile;
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
                        App.getFile(url, App.showFileLink, hash, 'Record_' + hash, list);
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
