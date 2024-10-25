# Event Ticket Sale Smart Contract

A Solidity smart contract for managing event ticket sales on the Ethereum blockchain. This contract enables ticket purchases, ticket swapping between users, and secure ticket resales with built-in service fees.

## Features

- Direct ticket purchases from the contract
- One ticket per address limitation
- Ticket ownership validation
- Secure ticket swapping between users
- Ticket resale functionality with service fees
- Real-time checking of available resale tickets

## Contract Interface

### Constructor
```solidity
constructor(uint numTickets, uint price)
```
- Creates a ticket sale contract with specified number of tickets and price per ticket
- Sets the contract deployer as the manager

### Main Functions

1. `buyTicket(uint ticketId) payable`
   - Purchase a ticket with the specified ID
   - Requirements:
     - Valid ticket ID
     - Ticket not already sold
     - Buyer doesn't own any ticket
     - Correct amount of ETH sent

2. `getTicketOf(address person) public view returns (uint)`
   - Returns the ticket ID owned by the specified address
   - Returns 0 if the address doesn't own a ticket

3. `offerSwap(uint ticketId)`
   - Submit an offer to swap your ticket with another ticket
   - Must own a ticket to offer a swap

4. `acceptSwap(uint ticketId)`
   - Accept a pending swap offer
   - Requirements:
     - Both parties must own tickets
     - Valid swap offer must exist

5. `resaleTicket(uint price)`
   - List your ticket for resale at specified price
   - Must own a ticket to list it

6. `acceptResale(uint ticketId) payable`
   - Purchase a resale ticket
   - 10% service fee applies (goes to manager)
   - Requirements:
     - Ticket must be listed for resale
     - Buyer doesn't own any ticket
     - Correct amount of ETH sent

7. `checkResale() public view returns (uint[] memory)`
   - View all tickets currently listed for resale and their prices

## Example Usage Scenario

Using Sziget Festival as an example:

1. Festival creates contract for 100,000 tickets at 10,000 wei each
2. Tickets 1-10,000 are for Monday, 10,001-20,000 for Tuesday, etc.
3. Example transactions:
   - Alice buys ticket #784
   - Bob buys ticket #10,322
   - Alice and Bob swap tickets through the contract
   - Alice lists her ticket for resale
   - Claire purchases Alice's resale ticket

## Development

### Prerequisites
- Solidity ^0.8.17
- Node.js
- Ganache (for testing)

### Setup
1. Clone the repository
2. Install dependencies
3. Compile the contract using `node compile.js`

### Testing
1. Launch Ganache test network
2. Run the test suite to verify all functions
3. Test cases cover all main functionalities:
   - Ticket purchase
   - Ticket swapping
   - Ticket resale
   - Ownership validation
   - Fee distribution

### Compilation
Generate ABI and Bytecode using:
```bash
node compile.js
```
The output will include:
- Contract ABI (for interface)
- Bytecode (for deployment)

## Security Considerations
- One ticket per address enforcement
- Secure swap mechanism
- Protected resale functionality
- Manager fee distribution
- Input validation for all transactions

## Note
This contract is designed for educational purposes. For production use, additional security audits and optimizations are recommended.