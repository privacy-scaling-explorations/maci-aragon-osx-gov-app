import { type Address } from "viem";
import { type ChainName, getChain } from "./utils/chains";

// Contract Addresses
export const PUB_DAO_ADDRESS = (process.env.NEXT_PUBLIC_DAO_ADDRESS ?? "") as Address;
export const PUB_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS ?? "") as Address;

// MACI voting
export const PUB_MACI_VOTING_PLUGIN_ADDRESS = (process.env.NEXT_PUBLIC_MACI_VOTING_PLUGIN_ADDRESS ?? "") as Address;
export const PUB_MACI_ADDRESS = (process.env.NEXT_PUBLIC_MACI_ADDRESS ?? "") as Address;
export const PUB_MACI_DEPLOYMENT_BLOCK = Number(process.env.NEXT_PUBLIC_MACI_DEPLOYMENT_BLOCK ?? 0);
export const NEXT_PUBLIC_SECONDS_PER_BLOCK = Number(process.env.NEXT_PUBLIC_SECONDS_PER_BLOCK ?? 1); // ETH Mainnet block takes ~12s

// MACI Coordinator service
export const PUB_COORDINATOR_SERVICE_URL = process.env.NEXT_PUBLIC_COORDINATOR_SERVICE_URL ?? "";

// Target chain
export const PUB_CHAIN_NAME = (process.env.NEXT_PUBLIC_CHAIN_NAME ?? "sepolia") as ChainName;
export const PUB_CHAIN = getChain(PUB_CHAIN_NAME);

export const PUB_L2_CHAIN_NAME = (process.env.NEXT_PUBLIC_L2_CHAIN_NAME ?? "arbitrumSepolia") as ChainName;
export const PUB_L2_CHAIN = getChain(PUB_L2_CHAIN_NAME);

// Network and services
export const PUB_ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "";

export const PUB_WEB3_ENDPOINT = (process.env.NEXT_PUBLIC_WEB3_URL_PREFIX ?? "") + PUB_ALCHEMY_API_KEY;
export const PUB_WEB3_ENDPOINT_L2 = (process.env.NEXT_PUBLIC_WEB3_URL_PREFIX_L2 ?? "") + PUB_ALCHEMY_API_KEY;
export const PUB_WEB3_MAINNET_ENDPOINT = (process.env.NEXT_PUBLIC_WEB3_URL_PREFIX_MAINNET ?? "") + PUB_ALCHEMY_API_KEY;

export const PUB_ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ?? "";

export const PUB_WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "";

export const PUB_IPFS_ENDPOINT = process.env.NEXT_PUBLIC_IPFS_ENDPOINT ?? "";
export const PUB_IPFS_API_KEY = process.env.NEXT_PUBLIC_IPFS_API_KEY ?? "";

export const PUB_IPFS_ENDPOINTS = process.env.NEXT_PUBLIC_IPFS_ENDPOINTS ?? "";
export const PUB_PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT ?? "";

// General
export const PUB_APP_NAME = "Aragonette";
export const PUB_APP_DESCRIPTION = "Simplified user interface for Aragon DAO's";

export const PUB_PROJECT_URL = process.env.NEXT_PUBLIC_PROJECT_URL ?? "https://aragon.org/";
export const PUB_WALLET_ICON = "https://avatars.githubusercontent.com/u/37784886";

export const PUB_DISCORD_URL = "https://discord.com/";
