// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentCredit.sol";

contract AgentCreditTest is Test {
    AgentCredit public credit;
    address worker1 = address(0xBEEF);
    address worker2 = address(0xCAFE);
    address attacker = address(0xDEAD);

    function setUp() public {
        credit = new AgentCredit();
    }

    // ── Happy Path ────────────────────────────────────────────────────────────

    function test_RegisterWorker() public {
        credit.registerWorker(worker1);
        assertTrue(credit.getWorkerStats(worker1).isRegistered);
        assertEq(credit.totalWorkers(), 1);
    }

    function test_RegisterWorkerIdempotent() public {
        credit.registerWorker(worker1);
        credit.registerWorker(worker1); // segunda vez no falla
        assertEq(credit.totalWorkers(), 1); // solo cuenta una vez
    }

    function test_AddCredit() public {
        credit.registerWorker(worker1);
        credit.addCredit(worker1, 1, bytes32("0xabc"));

        AgentCredit.WorkerStats memory s = credit.getWorkerStats(worker1);
        assertEq(s.score,              15); // 10 + 5
        assertEq(s.totalDataProcessed, 1);
        assertEq(s.totalPayments,      1);
        assertEq(credit.totalTransactions(), 1);
    }

    function test_Penalize() public {
        credit.registerWorker(worker1);
        credit.addCredit(worker1, 10, bytes32("0xaaa")); // score = 105
        credit.penalizeWorker(worker1);                  // -50 → score = 55
        assertEq(credit.getWorkerStats(worker1).score, 55);
    }

    function test_Leaderboard() public {
        credit.registerWorker(worker1);
        credit.registerWorker(worker2);
        credit.addCredit(worker1, 3, bytes32("0x001")); // score = 35
        credit.addCredit(worker2, 1, bytes32("0x002")); // score = 15

        (address[] memory addrs, uint256[] memory scores,,) = credit.getLeaderboard();
        assertEq(addrs.length,  2);
        assertEq(scores[0],    35);
        assertEq(scores[1],    15);
    }

    // ── Edge Cases ────────────────────────────────────────────────────────────

    function test_DuplicatePaymentReverts() public {
        credit.registerWorker(worker1);
        bytes32 hash = bytes32("0xduplicado");
        credit.addCredit(worker1, 1, hash);

        vm.expectRevert("AgentCredit: already processed");
        credit.addCredit(worker1, 1, hash);
    }

    function test_UnregisteredWorkerReverts() public {
        vm.expectRevert("AgentCredit: not registered");
        credit.addCredit(worker1, 1, bytes32("0x123"));
    }

    function test_PenalizeNoUnderflow() public {
        credit.registerWorker(worker1);
        credit.addCredit(worker1, 1, bytes32("0xbbb")); // score = 15
        credit.penalizeWorker(worker1); // penalty = 15 (no puede ser 50)
        assertEq(credit.getWorkerStats(worker1).score, 0);
    }

    function test_PausedReverts() public {
        credit.registerWorker(worker1);
        credit.setPaused(true);

        vm.expectRevert("AgentCredit: paused");
        credit.addCredit(worker1, 1, bytes32("0xccc"));
    }

    function test_OnlyOwnerCanCredit() public {
        credit.registerWorker(worker1);
        vm.prank(attacker);
        vm.expectRevert("AgentCredit: not owner");
        credit.addCredit(worker1, 1, bytes32("0xddd"));
    }

    function test_TransferOwnership() public {
        credit.transferOwnership(worker1);
        assertEq(credit.owner(), worker1);

        // el antiguo owner ya no puede operar
        vm.expectRevert("AgentCredit: not owner");
        credit.registerWorker(worker2);
    }

    // ── Fuzz Test ─────────────────────────────────────────────────────────────

    function testFuzz_ScoreGrowsLinear(uint8 chunks) public {
        vm.assume(chunks > 0 && chunks < 200);
        credit.registerWorker(worker1);
        credit.addCredit(worker1, chunks, bytes32(uint256(chunks)));

        uint256 expected = (uint256(chunks) * 10) + 5;
        assertEq(credit.getWorkerStats(worker1).score, expected);
    }
}