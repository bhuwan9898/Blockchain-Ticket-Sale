const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const { interface, bytecode } = require("./compile");
const provider = new HDWalletProvider(
  "view relief stool awesome over chat element amateur market coffee inherit castle",
  "https://sepolia.infura.io/v3/ab9403cf01974837a56d11fd398e4ebc"
);
const web3 = new Web3(provider);
const deploy = async () => {
  accounts = await web3.eth.getAccounts();
  console.log("Attempting to deploy from account", accounts[0]);
  // Deploy the contract with constructor arguments
  ticketSale = await new web3.eth.Contract(abi)
    .deploy({
      data: bytecode,
      arguments: [10, 100], // Passing number of tickets(10) and price(100 each)
    })
    .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000 });
  console.log("Contract deployed to", inbox.options.address);
  provider.engine.stop();
};
deploy();
