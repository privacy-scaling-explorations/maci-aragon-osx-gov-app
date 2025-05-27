import { NEXT_PUBLIC_SECONDS_PER_BLOCK, PUBLIC_CHAIN } from "@/constants";
import { config } from "@/context/Web3Modal";
import { getBlock } from "@wagmi/core";
import { mainnet } from "viem/chains";
import { type usePublicClient } from "wagmi";

/* This is the optimized version that uses the latest block to avoid redundant RPC calls. 
But there's aspects of the problem that should be taken into account. */
export async function getPastBlockNumberAtTimestamp(
  timestamp: bigint,
  client: ReturnType<typeof usePublicClient>,
  latestBlock: any
): Promise<bigint> {
  const latestTimestamp = latestBlock.timestamp;
  const latestNumber = latestBlock.number;

  const secondsAgo = Number(latestTimestamp - timestamp);
  const estimatedBlocksAgo = Math.floor(secondsAgo / NEXT_PUBLIC_SECONDS_PER_BLOCK);
  const margin = Math.floor(Math.max(50, estimatedBlocksAgo * 0.2));
  let start = latestBlock.number - BigInt(estimatedBlocksAgo + margin);

  if (start < 0n) start = 0n;
  let end = latestNumber;

  while (start <= end) {
    const mid = (start + end) / 2n;
    const block = await client!.getBlock({ blockNumber: mid });

    if (block.timestamp === timestamp) {
      return block.number;
    } else if (block.timestamp < timestamp) {
      start = mid + 1n;
    } else {
      end = mid - 1n;
    }
  }

  const closestBlock = await client!.getBlock({ blockNumber: end });
  return closestBlock.number;
}

export async function getCurrentBlock() {
  // Fetch the latest block as usual
  let chainIdToFetchBlock = PUBLIC_CHAIN.id;
  // Arbitrum block.number is the parent chain block number (ETH Mainnet)
  if (PUBLIC_CHAIN.name.toLowerCase().includes("arbitrum")) {
    chainIdToFetchBlock = mainnet.id;
  }

  const latestBlock = await getBlock(config, {
    chainId: chainIdToFetchBlock,
    blockTag: "latest",
  });

  return latestBlock;
}

export async function getFutureBlockNumberAtTimestamp(futureTimestamp: bigint, latestBlock: any): Promise<bigint> {
  const currentBlockNumber = latestBlock.number;
  const currentTimestamp = latestBlock.timestamp;

  const timeDifference = futureTimestamp - currentTimestamp;

  const estimatedBlocks = Math.ceil(Number(timeDifference) / NEXT_PUBLIC_SECONDS_PER_BLOCK);

  const futureBlockNumber = currentBlockNumber + BigInt(estimatedBlocks);

  return futureBlockNumber;
}

/**
 * Gets the block number at a specific timestamp, handling both past and future timestamps.
 *
 * @param timestamp - The target timestamp (in seconds) to find the block number for
 * @param client - The public client instance from wagmi
 * @returns Promise<bigint> - The estimated or exact block number at the given timestamp
 *
 * @description
 * - For future timestamps: Uses blockchain speed (NEXT_PUBLIC_SECONDS_PER_BLOCK) to estimate the block number
 * - For past/current timestamps: Uses binary search with optimization to find the closest block
 * - Automatically detects whether the timestamp is in the past or future by comparing with current block timestamp
 */
export async function getBlockNumberAtTimestamp(
  timestamp: bigint,
  client: ReturnType<typeof usePublicClient>
): Promise<bigint> {
  const latestBlock = await getCurrentBlock();
  const currentTimestamp = latestBlock.timestamp;

  if (timestamp > currentTimestamp) {
    return getFutureBlockNumberAtTimestamp(timestamp, latestBlock);
  }

  return getPastBlockNumberAtTimestamp(timestamp, client, latestBlock);
}
