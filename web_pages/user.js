const ipfs = new IpfsApi('localhost', '5001', {protocol: 'http'});

App = {
    web3Provider: null,
    contracts: {},
    visibleRecords: new Set(),


    init: function () {
        App.initWeb3();
        App.initUi();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider; // Connects to MetaMask
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initUi: function () {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.error(error);
                App.showDefaultError();
                return;
            }
            const account = accounts[0]; // There is only one account if you are logged in using MetaMask.

            App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
                return recordSystem.getPublicKey.call(account);
            }).then(function (publicKey) {
                const keys = {
                    'private': '',
                    'public': publicKey
                };
                App.showKeys(keys);
                App.handleUpdateForPatient(undefined, true);
            }).catch(function (err) {
                console.error(err.message);
                App.showDefaultError();
            });
        });
    },

    initContract: function () {
        $.getJSON('/truffle/build/contracts/MedicalRecordSystem.json', function (data) {
            App.contracts.MedicalRecordSystem = TruffleContract(data);
            App.contracts.MedicalRecordSystem.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '.btn-upload', App.handleUpload);
        $(document).on('click', '.btn-update', App.handleUpdateForPatient);
        $(document).on('click', '.btn-update-medic', App.handleUpdateForMedic);
        $(document).on('click', '.btn-generate-keys', App.handleGenerateKeys);
        $(document).on('click', '.btn-grant-access', App.handleGrantAccessToAllFiles);
    },

    handleUpload: function (event) {
        event.preventDefault();

        const fileUploader = $('#file-upload')[0];
        if (!fileUploader.files || !fileUploader.files[0]) {
            alert('Error: No file selected');
            return;
        }
        if ($('#publicKey').val() === '') {
            alert('Error: You need to generate or enter your public key first.');
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

    handleUpdateForPatient: function (event, initialization = false) {
        if (event !== undefined) {
            event.preventDefault();
        }

        const callbackData = App.clearRecordsList();
        App.getFilesAsPatient(App.showFileLink, callbackData, initialization);
    },

    handleUpdateForMedic: function (event) {
        event.preventDefault();

        const patientAccount = $('#patient-address').val();
        const callbackData = App.clearRecordsList();
        App.getFilesAsMedic(App.showFileLink, callbackData, patientAccount);
    },

    handleGenerateKeys: function () {
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
                App.showDefaultError();
            }
        });
    },

    handleGrantAccessToAllFiles: function (event) {
        event.preventDefault();

        const account = $('#recipient-address').val();
        if (account === '') {
            alert('Error: Enter a valid blockchain address');
            return;
        }
        if (!App.requireKeys()) {
            return;
        }

        App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
            return recordSystem.getPublicKey.call(account);
        }).then(function (publicKey) {
            if (publicKey === '') {
                alert('Error: This user does not have a public key yet.');
                return;
            }

            const callbackData = {
                publicKey: publicKey,
                account: account
            };
            App.getFilesAsPatient(App.grantAccess, callbackData);
        }).catch(function (err) {
            console.error(err.message);
            alert('Error: Enter a valid blockchain address');
        });
    },

    handleDecrypt: function (event) {
        event.preventDefault();

        if (!App.requireKeys()) {
            return;
        }

        const fileJson = JSON.parse(event.target.getAttribute('encryptedFile'));

        App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
            const fileHash = event.target.getAttribute('fileHash');
            const promises = [recordSystem.getPublicKey.call(fileJson.owner), recordSystem.getReKey.call(fileHash)];
            Promise.all(promises).then(function (keys) {
                const data = {
                    file: fileJson.file,
                    capsule: fileJson.capsule,
                    private_key: $('#privateKey').val(),
                    public_key: $('#publicKey').val()
                };

                if (keys[1] !== '') {
                    // medical professional
                    data.re_key = keys[1];
                    data.owner_public_key = keys[0];
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
                        $('#record').text('');
                        console.error(textStatus);
                        console.error(jqXHR.responseJSON);
                        console.error(errorThrown);
                        alert('Error: Decryption failed. The specified keys do not match the keys used for (re-)encryption.')
                    }
                });
            })
        }).catch(function (err) {
            console.error(err.message);
            App.showDefaultError();
        });
    },

    grantAccess: function (encryptedFile, callbackData) {
        const fileJson = JSON.parse(encryptedFile);
        const data = {
            private_key: $('#privateKey').val(),
            public_key: callbackData.publicKey,
            capsule: fileJson.capsule
        };
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: 'http://localhost:8000/grant_access',
            data: data,
            hash: callbackData.hash,
            success: function (data, textStatus, jqXHR1) {
                const hash = this.hash;
                App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
                    return recordSystem.addReKey(callbackData.account, hash, data.re_key);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(jqXHR.responseJSON);
                console.error(errorThrown);
                App.showDefaultError();
            }
        });
    },

    showKeys: function (keys) {
        $('#privateKey').val(keys['private']);
        $('#publicKey').val(keys['public']);
    },

    setKeys: function (keys) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.error(error);
                App.showDefaultError();
                return;
            }
            const account = accounts[0]; // There is only one account if you are logged in using MetaMask.

            App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
                return recordSystem.setPublicKey(keys['public'], {from: account});
            }).then(function (result) {
                App.showKeys(keys);
            }).catch(function (err) {
                console.error(err.message);
                App.showDefaultError();
            });
        });
    },

    uploadFileToIpfs: function (encryptedFile) {
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.error(error);
                App.showDefaultError();
                return;
            }

            const account = accounts[0]; // There is only one account if you are logged in using MetaMask.
            encryptedFile.owner = account;

            const buffer = Buffer.from(JSON.stringify(encryptedFile));
            ipfs.add(buffer, (err, ipfsHash) => {
                const fileHash = ipfsHash[0].hash;

                App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
                    return recordSystem.upload(fileHash, {from: account});
                }).catch(function (err) {
                    console.error(err.message);
                    App.showDefaultError();
                });
            });
        });
    },

    encryptFile: function (file) {
        const data = {
            file: file,
            public_key: $('#publicKey').val()
        };
        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: 'http://localhost:8000/encrypt',
            data: data,
            success: function (data, textStatus, jqXHR1) {
                App.uploadFileToIpfs(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error(textStatus);
                console.error(jqXHR.responseJSON);
                console.error(errorThrown);
                App.showDefaultError();
            }
        });
    },

    showFileLink: function (encryptedFile, callbackData) {
        if (App.visibleRecords.has(callbackData.hash)) {
            // prevent duplicates
            return;
        }
        App.visibleRecords.add(callbackData.hash);

        const fileName = 'Record_' + callbackData.hash;
        const link = document.createElement('a');
        link.appendChild(document.createTextNode(fileName));
        link.title = fileName;
        link.href = callbackData.url;
        link.target = '_blank';

        const button = document.createElement('button');
        const idClass = 'btn-decrypt' + fileName;
        button.textContent = 'Decrypt';
        button.classList = 'btn btn-secondary decrypt-button btn-decrypt ' + idClass;
        button.type = 'button';
        button.setAttribute('encryptedFile', encryptedFile);
        button.setAttribute('fileHash', callbackData.hash);
        $(document).on('click', '.' + idClass, App.handleDecrypt);

        const listItem = document.createElement('li');
        listItem.appendChild(button);
        listItem.appendChild(link);
        callbackData.list.appendChild(listItem);
    },

    getFile: function (hash, callback, callbackData) {
        const xmlHttp = new XMLHttpRequest();
        const url = 'http://localhost:8080/ipfs/' + hash;
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                callbackData.hash = hash;
                callbackData.url = url;
                callback(xmlHttp.responseText, callbackData);
            }
        };
        xmlHttp.open('GET', url, true);
        xmlHttp.send(null);
    },

    getFilesAsPatient: function (callback, callbackData, initialization = false) {
        if (callbackData === undefined) {
            callbackData = {};
        }

        App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
            recordSystem.getNumberOfRecords.call().then(function (numberOfRecords) {
                numberOfRecords = numberOfRecords.toNumber();

                if (numberOfRecords === 0 && !initialization) {
                    alert('Info: There are no records. It might take some seconds for a new record to be accessible (due to mining).');
                    return;
                }

                const promises = [];

                for (let i = 0; i < numberOfRecords; i++) {
                    promises.push(recordSystem.getRecordByIndex.call(i));
                }

                Promise.all(promises).then(function (hashes) {
                    for (const i in hashes) {
                        App.getFile(hashes[i], callback, callbackData);
                    }
                });
            })
        }).catch(function (err) {
            console.error(err.message);
            App.showDefaultError();
        });
    },

    getFilesAsMedic: function (callback, callbackData, patient) {
        if (callbackData === undefined) {
            callbackData = {};
        }

        if (patient === '') {
            alert('Error: Enter a valid blockchain address');
            return;
        }

        App.contracts.MedicalRecordSystem.deployed().then(function (recordSystem) {
            recordSystem.getNumberOfForeignRecords.call(patient).then(function (numberOfRecords) {
                const readRecordEvent = recordSystem.ReadRecord();

                readRecordEvent.watch(function (error, result) {
                    if (error) {
                        console.error(error);
                        App.showDefaultError();
                        return;
                    }

                    App.getFile(result.args.hashPointer, callback, callbackData);
                });

                numberOfRecords = numberOfRecords.toNumber();
                if (numberOfRecords === 0) {
                    alert('Info: The patient has not granted you access to their records.');
                    return;
                }

                for (let i = 0; i < numberOfRecords; i++) {
                    recordSystem.getForeignRecordByIndex(patient, i);
                }
            }).catch(function (err) {
                console.error(err.message);
                alert('Error: Enter a valid blockchain address');
            });
        }).catch(function (err) {
            console.error(err.message);
            App.showDefaultError();
        });
    },

    clearRecordsList: function () {
        const list = document.getElementById('records');
        list.innerHTML = '';+
        App.visibleRecords.clear();
        return {list: list};
    },

    requireKeys: function () {
        const keysSet = $('#privateKey').val() !== '' && $('#publicKey').val() !== '';
        if (!keysSet) {
            alert('Error: You need to enter both of your keys first.');
        }
        return keysSet;
    },

    showDefaultError: function () {
        alert('An unknown error occurred. Additional output can be found in the browser console. Make sure to follow the steps in the README.md.')
    },
};

window.onload = function () {
    App.init();
};
