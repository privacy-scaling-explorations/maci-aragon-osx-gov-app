import { useState, useEffect } from "react";
import { createPublicClient, http, parseAbi } from "viem";
import { getPoll } from "@maci-protocol/sdk/browser";
import { PUBLIC_CHAIN, PUBLIC_MACI_ADDRESS, PUBLIC_WEB3_ENDPOINT } from "@/constants";
import { useEthersSigner } from "./useEthersSigner";

export const useCanFinalize = (pollId?: bigint) => {
  const [canFinalize, setCanFinalize] = useState(false);

  const publicClient = createPublicClient({
    chain: PUBLIC_CHAIN,
    transport: http(PUBLIC_WEB3_ENDPOINT),
  });
  const signer = useEthersSigner();

  useEffect(() => {
    if (!pollId || !signer) {
      return;
    }

    const checkCanFinalize = async () => {
      try {
        const { address: pollAddress } = await getPoll({
          maciAddress: PUBLIC_MACI_ADDRESS,
          pollId,
          signer,
        });

        const pollAbi = parseAbi(["function endDate() view returns (uint256)"]);
        const endDate = await publicClient.readContract({
          address: pollAddress as `0x${string}`,
          abi: pollAbi,
          functionName: "endDate",
        });

        const now = (await publicClient.getBlock()).timestamp;

        if (now < endDate) {
          setCanFinalize(false);
          return;
        }

        setCanFinalize(true);
      } catch (error) {
        console.log("Error checking if poll can be finalized:", error);
        setCanFinalize(false);
      }
    };

    checkCanFinalize();
  }, [pollId, publicClient, signer]);

  return canFinalize;
};
