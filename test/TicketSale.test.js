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
      arguments: [10, 100], // Passing number of tickets(10) and price(100 each)
    })
    .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000 });
});

describe("ticketSale", () => {
  it("deploys a contract", () => {
    assert.ok(ticketSale.options.address);
  });

  it("buys the ticket", async () => {
    const ticketId = 1; //buy ticket with id 1
    const buyer = accounts[1];
    const initialBalance = await web3.eth.getBalance(buyer);
    await ticketSale.methods.buyTicket(ticketId).send({
      from: buyer,
      value: 100,
    });
    // gets the ticket id owned by buyer
    const ticketIdOwned = parseInt(
      await ticketSale.methods.getTicketOf(buyer).call()
    );
    const finalBalance = await web3.eth.getBalance(buyer);

    assert.equal(
      ticketIdOwned,
      ticketId,
      "Ticket owned by buyer and ticket sold should be same"
    );
    assert(
      web3.utils.toBN(initialBalance).gt(web3.utils.toBN(finalBalance)),
      "Buyer's balance will decrease"
    );

    //check if the owner of this ticket is the buyer

    const buyerTicket = await ticketSale.methods.tickets(ticketId).call();
    assert.equal(
      buyerTicket.owner,
      buyer,
      "Ticket will be assigned to the buyer"
    );
  });

  it("offers ticket swap", async () => {
    // create two buyers who will swap tickets
    const buyer1 = accounts[1];
    const buyer2 = accounts[2];
    const ticket1Id = 1;
    const ticket2Id = 2;

    // both users will buy a ticket with value 100(since I have set the price of each ticket to be 100)
    await ticketSale.methods.buyTicket(ticket1Id).send({ from: buyer1, value: 100 });
    await ticketSale.methods.buyTicket(ticket2Id).send({ from: buyer2, value: 100 });

    // Now, let's have buyer1 offer to swap their ticket with buyer2's ticket
    await ticketSale.methods.offerSwap(ticket2Id).send({ from: buyer1 });

    // Check if the swap offer was recorded correctly
    const swapOffer = parseInt(await ticketSale.methods.swapOffers(buyer1, buyer2).call());

    assert.equal(
      swapOffer,
      ticket1Id,
      "Swap offer should be recorded correctly"
    );

    // Verify that buyer1 still owns their original ticket since at the moment accept swap is not run
    const buyer1Ticket = parseInt(await ticketSale.methods.getTicketOf(buyer1).call());
    assert.equal(
      buyer1Ticket,
      ticket1Id,
      "Buyer1 should still own their original ticket"
    );

    // Verify that buyer2 still owns their original ticket
    const buyer2Ticket = parseInt(await ticketSale.methods.getTicketOf(buyer2).call());
    assert.equal(
      buyer2Ticket,
      ticket2Id,
      "Buyer2 should still own their original ticket"
    );
  });

  // it("accepts swap", () => {

  // });
  // it("resales ticket", () => {

  // });
  // it("accepts resale ticket", () => {

  // });
  // it("checks resale tickets", () => {

  // });
});
