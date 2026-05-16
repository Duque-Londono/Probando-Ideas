// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentCredit.sol";

contract DeployAgentCredit is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerKey);

        AgentCredit agentCredit = new AgentCredit();

        console.log("=====================================");
        console.log("AgentCredit deployed at:", address(agentCredit));
        console.log("Owner:", agentCredit.owner());
        console.log("=====================================");

        vm.stopBroadcast();
    }
}