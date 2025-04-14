import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { vars } from "hardhat/config";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.27", // For Swap.sol
      },
      {
        version: "0.8.28", // For Lock.sol
      },
    ],
  },
  networks: {
    monadTestnet: {
      url: process.env.MONAD_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: Number(process.env.MONAD_CHAIN_ID) || 10143,
    },
  },
};

export default config;
