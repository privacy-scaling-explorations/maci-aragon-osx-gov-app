import { NEXT_PUBLIC_SECONDS_PER_BLOCK, PUB_CHAIN } from "@/constants";
import { config } from "@/context/Web3Modal";
import { getBlock } from "@wagmi/core";
import { mainnet } from "viem/chains";
import { type usePublicClient } from "wagmi";

// This results in a crap ton of requests to the RPC node, so we need a better way.
export async function getBlockNumberAtTimestamp(
  timestamp: bigint,
  client: ReturnType<typeof usePublicClient>
): Promise<bigint> {
  const latestBlock = await client!.getBlock();
  const end = latestBlock.number;

  async function recursiveSearch(start: bigint, end: bigint): Promise<bigint> {
    if (start > end) {
      const closestBlock = await client!.getBlock({ blockNumber: start });
      return closestBlock?.number ?? latestBlock.number;
    }

    const mid = (start + end) / 2n;
    const block = await client!.getBlock({ blockNumber: mid });

    if (block.timestamp === timestamp) {
      return block.number;
    } else if (block.timestamp < timestamp) {
      return recursiveSearch(mid + 1n, end);
    } else {
      return recursiveSearch(start, mid - 1n);
    }
  }

  return recursiveSearch(0n, end);
}

export async function getCurrentBlock() {
  // Fetch the latest block as usual
  let chainIdToFetchBlock = PUB_CHAIN.id;
  // Arbitrum block.number is the parent chain block number (ETH Mainnet)
  if (PUB_CHAIN.name.toLowerCase().includes("arbitrum")) {
    chainIdToFetchBlock = mainnet.id;
  }

  const latestBlock = await getBlock(config, {
    chainId: chainIdToFetchBlock,
    blockTag: "latest",
  });

  return latestBlock;
}

export async function getFutureBlockNumberAtTimestamp(futureTimestamp: bigint): Promise<bigint> {
  const latestBlock = await getCurrentBlock();
  const currentBlockNumber = latestBlock.number;
  const currentTimestamp = latestBlock.timestamp;

  const timeDifference = futureTimestamp - currentTimestamp;

  const estimatedBlocks = Math.ceil(Number(timeDifference) / NEXT_PUBLIC_SECONDS_PER_BLOCK);

  const futureBlockNumber = currentBlockNumber + BigInt(estimatedBlocks);

  return futureBlockNumber;
}
