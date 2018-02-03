/**
 * Created by zhaoyiyu on 2018/1/29.
 */

Web3 = require('web3');
//url = 'https://rinkeby.infura.io/0x585a40461ff12c6734e8549a7fb527120d4b8d0d';
url = "https://mainnet.infura.io";
const web3 = new Web3(new Web3.providers.HttpProvider(url));

//init
const Tx = require('ethereumjs-tx');
const ethjsaccount = require('ethjs-account');
const fs = require('fs');
const solc = require('solc');

// compile the code
const input = fs.readFileSync('./contract/erc20Token.sol');
const output = solc.compile(input.toString());
const abi = JSON.parse(output.contracts[':TokenERC20'].interface);

//------------------------------ init property ----------------------------
Config = require('./config/config.js');

//amount of airdrop
var amount = Config.approveModule.amount;
//airdrop contract address
var airdropApproveAddress = Config.approveModule.airdropApproveAddress;
//user privateKey
var userPrivateKey = Config.approveModule.userPrivateKey;
//erc20 token contract address
var tokenContractAddress = Config.approveModule.tokenContractAddress;

//-------------------------------- contract --------------------------------
var token = new web3.eth.Contract(abi, tokenContractAddress);

function approveTransfer(approveAddress,amount,fromAddress,userPrivateKey,success, error) {

//  transaction config
    var t = {
        to: tokenContractAddress,
        value: '0x00',
        data: token.methods.approve(approveAddress,
            amount).encodeABI()
    };
//Get the current gas price (not used temporarily)
    web3.eth.getGasPrice().then(function(p) {
        //t.gasPrice = web3.utils.toHex(p);
        t.gasPrice = web3.utils.toHex(2000000000);
        //get nonce
        web3.eth.getTransactionCount(fromAddress,
            function(err, r) {
                t.nonce = web3.utils.toHex(r);
                t.from = fromAddress;
                //get gasLimit（not used temporarily）
                web3.eth.estimateGas(t,
                    function(err, gas) {
                        gas = '4700000';
                        t.gasLimit = web3.utils.toHex(gas);

                        var tx = new Tx(t);
                        var privateKey = new Buffer(userPrivateKey, 'hex');

                        //sign
                        tx.sign(privateKey);
                        var serializedTx = '0x' + tx.serialize().toString('hex');
                        // console.log("serializedTx----"+serializedTx);

                        console.log("send signed transaction");

                        //sendSignedTransaction
                        web3.eth.sendSignedTransaction(serializedTx).on('transactionHash',function(hash){
                            console.log('hashId:'+ hash+'\n');
                        }).on('receipt',function(receipt){
                            //console.log('receipt:'+ JSON.stringify(receipt));
                            var s = receipt.status;
                            console.log("resultStatus:"+s);
                            if(s == 1){
                                success(JSON.stringify(receipt));
                            }
                            else {
                                error(JSON.stringify(receipt));
                            }
                        }).on('confirmation',function(confirmationNumber, receipt){

                            /*web3.eth.getBlockNumber(function (number) {
                             console.log("number--"+number+"\n");
                             });*/
                            //  console.log('entrance'+ JSON.stringify(confirmationNumber)+'--------------'+ JSON.stringify(receipt));
                        }).on('error',function(error){
                            console.log('Failure to send a signature transaction：'+error);
                        });
                    });
            });
    });
};

var privateKeyToAddress = function(privateKey,result) {
    var address = ethjsaccount.privateToAccount(privateKey).address;
    result(address);
};

//Get the private key corresponding account and initiate the transfer
privateKeyToAddress(userPrivateKey,function (address) {

    console.log('from：'+address);

    approveTransfer(airdropApproveAddress,amount,address,userPrivateKey,function (success) {

        console.log("success:"+success);
    },function (error) {

        console.log("error:"+error);
    });
});







