const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { abi, bytecode } = require("../scripts/compile");

beforeEach(async () => {
  // Get a list of all accounts
  accounts = await web3.eth.getAccounts();

  // Deploy the contract with constructor arguments
  ticketSale = await new web3.eth.Contract(abi)
    .deploy({
      data: bytecode,
      arguments: [10, 100] // Passing number of tickets and price
    })
    .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000 });
});


describe("ticketSale", () => {
  it("deploys a contract", () => {
    assert.ok(ticketSale.options.address);
  });
  
});
