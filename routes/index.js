const express = require('express');
const Web3 = require('web3');

const router = express.Router();

function setupWeb3() {
    let web3;
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    web3.setProvider(new web3.providers.HttpProvider('http://localhost', 0, 'admin', 'admin'));
    let coinbase = web3.eth.coinbase;
    let balance = web3.eth.getBalance(coinbase);

    console.log(coinbase);
    console.log(balance.toString(10));
}

/* GET home page. */
router.get('/', function (req, res, next) {
    setupWeb3();
    res.render('index', {title: 'Express'});
});

module.exports = router;
