const express = require('express');
const web3 = require('web3');

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(web3);
  res.render('index', { title: 'Express' });
});

module.exports = router;
