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
    const buyer1 = accounts[2];
    const buyer2 = accounts[3];
    const ticket1Id = 2;
    const ticket2Id = 3;

    // both users will buy a ticket with value 100(since I have set the price of each ticket to be 100)
    await ticketSale.methods
      .buyTicket(ticket1Id)
      .send({ from: buyer1, value: 100 });
    await ticketSale.methods
      .buyTicket(ticket2Id)
      .send({ from: buyer2, value: 100 });

    // Now, let's have buyer1 offer to swap their ticket with buyer2's ticket
    await ticketSale.methods.offerSwap(ticket2Id).send({ from: buyer1 });

    // Check if the swap offer was recorded correctly
    const swapOffer = parseInt(
      await ticketSale.methods.swapOffers(buyer1, buyer2).call()
    );

    assert.equal(
      swapOffer,
      ticket1Id,
      "Swap offer should be recorded correctly"
    );

    // Verify that buyer1 still owns their original ticket since at the moment accept swap is not run
    const buyer1Ticket = parseInt(
      await ticketSale.methods.getTicketOf(buyer1).call()
    );
    assert.equal(
      buyer1Ticket,
      ticket1Id,
      "Buyer1 should still own their original ticket"
    );

    // Verify that buyer2 still owns their original ticket
    const buyer2Ticket = parseInt(
      await ticketSale.methods.getTicketOf(buyer2).call()
    );
    assert.equal(
      buyer2Ticket,
      ticket2Id,
      "Buyer2 should still own their original ticket"
    );
  });

  it("accepts ticket swap offer", async () => {
    const buyer1 = accounts[4];
    const buyer2 = accounts[5];
    const ticket1Id = 4;
    const ticket2Id = 5;

    // Two buyers will buy tickets first
    await ticketSale.methods
      .buyTicket(ticket1Id)
      .send({ from: buyer1, value: 100 });
    await ticketSale.methods
      .buyTicket(ticket2Id)
      .send({ from: buyer2, value: 100 });

    const buyer1InitialTicket = parseInt(
      await ticketSale.methods.getTicketOf(buyer1).call()
    );
    const buyer2InitialTicket = parseInt(
      await ticketSale.methods.getTicketOf(buyer2).call()
    );
    // console.log("Initial Ticket-Buyer1: ", buyer1InitialTicket);
    // console.log("Initial Ticket-Buyer2: ", buyer2InitialTicket);

    // buyer1 offers to swap their ticket with buyer2's ticket
    await ticketSale.methods.offerSwap(ticket2Id).send({ from: buyer1 });

    //buyer2 will accept the swap offer
    await ticketSale.methods.acceptSwap(ticket2Id).send({ from: buyer2 });

    // // Verify that the tickets have been swapped
    const buyer1NewTicket = parseInt(
      await ticketSale.methods.getTicketOf(buyer1).call()
    );
    const buyer2NewTicket = parseInt(
      await ticketSale.methods.getTicketOf(buyer2).call()
    );
    //console.log("New Ticket-Buyer1: ", buyer1NewTicket);
    //console.log("New Ticket-Buyer2: ", buyer2NewTicket);
    assert.equal(buyer1NewTicket, ticket2Id, "Buyer1 should now own ticket2");
    assert.equal(buyer2NewTicket, ticket1Id, "Buyer2 should now own ticket1");
  });

  it("allows user to put ticket up for resale", async () => {
    const buyer = accounts[6];
    const ticketId = 6;
    const initialPrice = 100;
    const resalePrice = 120;

    // First, let's have the user buy a ticket
    await ticketSale.methods
      .buyTicket(ticketId)
      .send({ from: buyer, value: initialPrice });

    // Verify initial ticket ownership and price
    const initialOwner = parseInt(
      await ticketSale.methods.getTicketOf(buyer).call()
    );
    assert.equal(
      initialOwner,
      ticketId,
      "Buyer should own the ticket initially"
    );

    // // Put the ticket up for resale
    await ticketSale.methods.resaleTicket(resalePrice).send({ from: buyer });

    // // Verify the ticket is now for sale at the new price
    const resaleTicketDetails = await ticketSale.methods
      .tickets(ticketId)
      .call();
    assert.equal(
      resaleTicketDetails.price,
      resalePrice,
      "Resale price should be updated"
    );
    assert.equal(
      resaleTicketDetails.forSale,
      true,
      "Ticket should be marked for sale"
    );

    // Check if the ticket appears in the resale list
    const resaleList = await ticketSale.methods.checkResale().call();
    // console.log(resaleList);
    //I did toString() because initially in the array the ticketId and price are srored as strings
    assert(
      resaleList.includes(ticketId.toString()),
      "Ticket should appear in the resale list"
    );
  });

  it("allows user to purchase a resale ticket", async () => {
    const seller = accounts[7];
    const buyer = accounts[8];
    const manager = await ticketSale.methods.manager().call();
    const ticketId = 7;
    const initialPrice = 100;
    const resalePrice = 120;

    // First, let's have the seller buy a ticket
    await ticketSale.methods
      .buyTicket(ticketId)
      .send({ from: seller, value: initialPrice });

    // Put the ticket up for resale
    await ticketSale.methods.resaleTicket(resalePrice).send({ from: seller });

    // Get initial balances
    const initialSellerBalance = await web3.eth.getBalance(seller);
    const initialManagerBalance = await web3.eth.getBalance(manager);

    // Buyer purchases the resale ticket
    await ticketSale.methods
      .acceptResale(ticketId)
      .send({ from: buyer, value: resalePrice });

    // Verify the new ticket ownership
    const newOwner = parseInt(
      await ticketSale.methods.getTicketOf(buyer).call()
    );
    assert.equal(newOwner, ticketId, "Buyer should now own the ticket");

    // Verify the ticket is no longer for sale
    const ticketDetails = await ticketSale.methods.tickets(ticketId).call();
    assert.equal(
      ticketDetails.forSale,
      false,
      "Ticket should no longer be for sale"
    );

    // Verify the seller no longer owns the ticket
    const sellerTicket = parseInt(
      await ticketSale.methods.getTicketOf(seller).call()
    );
    assert.equal(sellerTicket, 0, "Seller should no longer own a ticket");

    // Calculate expected amounts
    const serviceFee = web3.utils
      .toBN(resalePrice)
      .mul(web3.utils.toBN(10))
      .div(web3.utils.toBN(100));
    const sellerAmount = web3.utils.toBN(resalePrice).sub(serviceFee);

    // Verify the seller received the correct amount
    const finalSellerBalance = await web3.eth.getBalance(seller);
    assert.equal(
      web3.utils
        .toBN(finalSellerBalance)
        .sub(web3.utils.toBN(initialSellerBalance))
        .toString(),
      sellerAmount.toString(),
      "Seller should receive the correct amount"
    );

    // Verify the manager received the service fee
    const finalManagerBalance = await web3.eth.getBalance(manager);
    assert.equal(
      web3.utils
        .toBN(finalManagerBalance)
        .sub(web3.utils.toBN(initialManagerBalance))
        .toString(),
      serviceFee.toString(),
      "Manager should receive the correct service fee"
    );
  });
});
