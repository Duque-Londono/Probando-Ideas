// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentCredit {

    // ── Structs ──────────────────────────────────────────────────────────────
    struct WorkerStats {
        uint256 score;
        uint256 totalDataProcessed;
        uint256 totalPayments;
        uint256 lastActiveBlock;
        bool    isRegistered;
    }

    // ── Storage ──────────────────────────────────────────────────────────────
    address public owner;
    bool    public paused;
    uint256 public totalWorkers;
    uint256 public totalTransactions;

    mapping(address  => WorkerStats) public workers;
    mapping(bytes32  => bool)        public processedPayments;
    address[] private workerIndex;

    // ── Constantes ───────────────────────────────────────────────────────────
    uint256 public constant SCORE_PER_CHUNK   = 10;
    uint256 public constant SCORE_PER_PAYMENT = 5;
    uint256 public constant PENALTY_CORRUPT   = 50;

    // ── Eventos ──────────────────────────────────────────────────────────────
    event WorkerRegistered(address indexed worker, uint256 timestamp);
    event CreditAdded(
        address indexed worker,
        uint256 scoreAdded,
        uint256 newScore,
        uint256 chunksProcessed,
        bytes32 txPaymentHash
    );
    event WorkerPenalized(address indexed worker, uint256 scoreLost, uint256 newScore);
    event Paused(bool status);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "AgentCredit: not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "AgentCredit: paused");
        _;
    }

    modifier onlyRegistered(address worker) {
        require(workers[worker].isRegistered, "AgentCredit: not registered");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Escritura (solo Owner) ───────────────────────────────────────────────

    function registerWorker(address worker) external onlyOwner whenNotPaused {
        require(worker != address(0), "AgentCredit: zero address");
        if (!workers[worker].isRegistered) {
            workers[worker].isRegistered    = true;
            workers[worker].lastActiveBlock = block.number;
            workerIndex.push(worker);
            totalWorkers++;
            emit WorkerRegistered(worker, block.timestamp);
        }
    }

    function addCredit(
        address worker,
        uint256 chunksDelivered,
        bytes32 txPaymentHash
    ) external onlyOwner onlyRegistered(worker) whenNotPaused {
        // CHECKS
        require(chunksDelivered > 0,                       "AgentCredit: zero chunks");
        require(!processedPayments[txPaymentHash],         "AgentCredit: already processed");

        // EFFECTS
        processedPayments[txPaymentHash] = true;

        uint256 scoreGained = (chunksDelivered * SCORE_PER_CHUNK) + SCORE_PER_PAYMENT;
        WorkerStats storage w = workers[worker];
        w.score               += scoreGained;
        w.totalDataProcessed  += chunksDelivered;
        w.totalPayments       += 1;
        w.lastActiveBlock      = block.number;
        totalTransactions++;

        // INTERACTIONS
        emit CreditAdded(worker, scoreGained, w.score, w.totalDataProcessed, txPaymentHash);
    }

    function penalizeWorker(address worker)
        external onlyOwner onlyRegistered(worker) whenNotPaused
    {
        WorkerStats storage w = workers[worker];
        uint256 penalty = w.score >= PENALTY_CORRUPT ? PENALTY_CORRUPT : w.score;
        w.score -= penalty;
        emit WorkerPenalized(worker, penalty, w.score);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AgentCredit: zero address");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ── Lectura (público, para Frontend y Servidor) ──────────────────────────

    function getLeaderboard() external view returns (
        address[] memory addrs,
        uint256[] memory scores,
        uint256[] memory chunksProcessed,
        uint256[] memory payments
    ) {
        uint256 len     = workerIndex.length;
        addrs           = new address[](len);
        scores          = new uint256[](len);
        chunksProcessed = new uint256[](len);
        payments        = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            address w        = workerIndex[i];
            addrs[i]         = w;
            scores[i]        = workers[w].score;
            chunksProcessed[i] = workers[w].totalDataProcessed;
            payments[i]      = workers[w].totalPayments;
        }
    }

    function getWorkerStats(address worker) external view returns (WorkerStats memory) {
        return workers[worker];
    }

    function getGlobalStats() external view returns (
        uint256 _totalWorkers,
        uint256 _totalTransactions
    ) {
        return (totalWorkers, totalTransactions);
    }
}