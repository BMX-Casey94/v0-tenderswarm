// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TenderEscrow is Ownable {
    IERC20 public immutable mnee;

    struct Tender {
        string taskHash;       // short description or IPFS hash
        uint256 reward;
        address winner;
        string deliverableURI; // IPFS or Google Drive link
        bool completed;
    }

    mapping(uint256 => Tender) public tenders;
    uint256 public tenderCount;

    event TenderCreated(uint256 indexed id, string task, uint256 reward);
    event DeliverySubmitted(uint256 indexed id, address provider, string uri);
    event TenderAccepted(uint256 indexed id, address winner, uint256 reward);

    constructor(address initialOwner, address mneeTokenAddress) Ownable(initialOwner) {
        mnee = IERC20(mneeTokenAddress);
    }

    function createTenders(string[] calldata tasks, uint256[] calldata rewards) external onlyOwner {
        require(tasks.length == rewards.length, "Mismatch");
        for (uint i = 0; i < tasks.length; i++) {
            tenderCount++;
            tenders[tenderCount] = Tender(tasks[i], rewards[i], address(0), "", false);
            emit TenderCreated(tenderCount, tasks[i], rewards[i]);
        }
    }

    // Provider submits (in demo we skip signature for speed)
    function submitDelivery(uint256 tenderId, string calldata uri) external {
        emit DeliverySubmitted(tenderId, msg.sender, uri);
    }

    // Evaluator agent calls this → instant payment
    function acceptDelivery(uint256 tenderId, address winner, string calldata uri) external onlyOwner {
        Tender storage t = tenders[tenderId];
        require(!t.completed, "Already completed");
        t.winner = winner;
        t.deliverableURI = uri;
        t.completed = true;
        mnee.transfer(winner, t.reward);
        emit TenderAccepted(tenderId, winner, t.reward);
    }

    // Client deposits full budget upfront
    function deposit(uint256 amount) external {
        mnee.transferFrom(msg.sender, address(this), amount);
    }
}
