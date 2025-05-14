import { JsonRpcProvider, type Signer, Wallet } from "ethers";

import { ErrorCodes } from "./errors";
import { ESupportedNetworks, viemChain } from "./networks";
import { type PublicClient, type HttpTransport, type Chain, createPublicClient, http } from "viem";

/**
 * @noitce getAlchemyRPCUrl copied from https://github.com/privacy-scaling-explorations/maci/blob/dev/apps/coordinator/ts/common/chain.ts
 *
 * Generate the RPCUrl for Alchemy based on the chain we need to interact with
 *
 * @param network - the network we want to interact with
 * @returns the RPCUrl for the network
 */
export const getAlchemyRPCUrl = (network: ESupportedNetworks): string => {
  const rpcAPIKey = process.env.RPC_API_KEY;

  if (!rpcAPIKey) {
    throw new Error(ErrorCodes.RPC_API_KEY_NOT_SET.toString());
  }

  switch (network) {
    case ESupportedNetworks.OPTIMISM_SEPOLIA:
      return `https://opt-sepolia.g.alchemy.com/v2/${rpcAPIKey}`;
    case ESupportedNetworks.ETHEREUM_SEPOLIA:
      return `https://eth-sepolia.g.alchemy.com/v2/${rpcAPIKey}`;
    default:
      throw new Error(ErrorCodes.UNSUPPORTED_NETWORK.toString());
  }
};

/**
 * @noitce getSigner copied from https://github.com/privacy-scaling-explorations/maci/blob/dev/apps/coordinator/ts/common/chain.ts
 *
 * Get a Ethers Signer given a chain and private key
 * @param chain
 * @returns
 */
export const getSigner = (chain: ESupportedNetworks): Signer => {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const alchemyRpcUrl = getAlchemyRPCUrl(chain);
  const provider = new JsonRpcProvider(alchemyRpcUrl);

  return wallet.connect(provider);
};

/**
 * @noitce getPublicClient copied from https://github.com/privacy-scaling-explorations/maci/blob/dev/apps/coordinator/ts/common/accountAbstraction.ts
 * The return type was modified to return underlying type
 *
 * Get a public client
 *
 * @param chainName - the name of the chain to use
 * @returns the public client
 */
export const getPublicClient = (chainName: ESupportedNetworks): PublicClient<HttpTransport, Chain> =>
  createPublicClient({
    transport: http(getAlchemyRPCUrl(chainName)),
    chain: viemChain(chainName),
  });
