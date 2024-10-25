const path = require("path");
const fs = require("fs");
const solc = require("solc");

const ticketsalePath = path.resolve(
  __dirname,
  "../contracts",
  "TicketSale.sol"
);
const source = fs.readFileSync(ticketsalePath, "utf8");
//console.log(source);
let input = {
  language: "Solidity",
  sources: {
    "TicketSale.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

const stringInput = JSON.stringify(input);
// console.log(stringInput);

const compiledCode = solc.compile(stringInput);
// console.log(compiledCode);

const output = JSON.parse(compiledCode);
const contractOutput = output.contracts;
// console.log(contractOutput);

const ticketSaleOutput = contractOutput["TicketSale.sol"];
// console.log(ticketsaleOutput);

const ticketSaleABI = ticketSaleOutput.TicketSale.abi;
// console.log(ticketsaleABI);

const ticketSaleBytecode = ticketSaleOutput.TicketSale.evm.bytecode;
// console.log(ticketsaleBytecode);
module.exports = { abi: ticketSaleABI, bytecode: ticketSaleBytecode.object };
