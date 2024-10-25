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
      arguments: [10, 100] // Passing number of tickets(10) and price(100 each)
    })
    .send({ from: accounts[0], gasPrice: 8000000000, gas: 4700000 });
});


describe("ticketSale", () => {
  it("deploys a contract", () => {
    assert.ok(ticketSale.options.address);
  });

  it("buys the ticket", async () => {
    const ticketId = 1;  //buy ticket with id 1 
    const buyer = accounts[1];
    const initialBalance = await web3.eth.getBalance(buyer);
    await ticketSale.methods.buyTicket(ticketId).send({
      from: buyer,
      value: 100,
      }
    )
    // gets the ticket id owned by buyer
    const ticketIdOwned = parseInt(await ticketSale.methods.getTicketOf(buyer).call());
    const finalBalance = await web3.eth.getBalance(buyer);

    assert.equal(ticketIdOwned, ticketId, "Ticket owned by buyer and ticket sold should be same");
    assert(web3.utils.toBN(initialBalance).gt(web3.utils.toBN(finalBalance)), "Buyer's balance will decrease");
    
    //check if the owner of this ticket is the buyer

    const buyerTicket = await ticketSale.methods.tickets(ticketId).call();
    assert.equal(buyerTicket.owner, buyer, "Ticket will be assigned to the buyer");
  });
  
  it("offers ticket for swap", async () => {
    const buyer1 = accounts[1];
    const buyer2 = accounts[2];
    const ticket1Id = 1;
    const ticket2Id = 2;

    // First, let's have two users buy tickets
    await ticketSale.buyTicket(ticket1Id, { from: buyer1, value: web3.utils.toWei('0.1', 'ether') });
    await ticketSale.buyTicket(ticket2Id, { from: buyer2, value: web3.utils.toWei('0.1', 'ether') });

    // Now, let's have buyer1 offer to swap their ticket with buyer2's ticket
    await ticketSale.offerSwap(ticket2Id, { from: buyer1 });

    // Check if the swap offer was recorded correctly
    const swapOffer = await ticketSale.swapOffers(buyer1, buyer2);

    assert.equal(swapOffer.toNumber(), ticket1Id, "Swap offer should be recorded correctly");

    // Verify that buyer1 still owns their original ticket
    const buyer1Ticket = await ticketSale.getTicketOf(buyer1);
    assert.equal(buyer1Ticket.toNumber(), ticket1Id, "Buyer1 should still own their original ticket");

    // Verify that buyer2 still owns their original ticket
    const buyer2Ticket = await ticketSale.getTicketOf(buyer2);
    assert.equal(buyer2Ticket.toNumber(), ticket2Id, "Buyer2 should still own their original ticket");
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
