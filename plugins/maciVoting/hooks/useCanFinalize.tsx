import { useState, useEffect } from "react";
import { getPoll } from "@maci-protocol/sdk/browser";
import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { useEthersSigner } from "./useEthersSigner";
import { usePublicClient } from "wagmi";
import { useCoordinator } from "./useCoordinator";

export const useCanFinalize = (pollId?: bigint) => {
  const [canFinalize, setCanFinalize] = useState(false);
  const { checkIsTallied } = useCoordinator();

  const publicClient = usePublicClient();
  const signer = useEthersSigner();

  useEffect(() => {
    if (!pollId || !publicClient || !signer) {
      return;
    }

    const checkCanFinalize = async () => {
      try {
        const { endDate } = await getPoll({
          maciAddress: PUBLIC_MACI_ADDRESS,
          pollId,
          signer,
        });
        const now = (await publicClient.getBlock()).timestamp;
        if (now < BigInt(endDate.toString())) {
          setCanFinalize(false);
          return;
        }

        const tallied = await checkIsTallied(Number(pollId));
        if (tallied === true) {
          setCanFinalize(false);
          return;
        }

        setCanFinalize(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Error checking if poll can be finalized:", error);
        setCanFinalize(false);
      }
    };

    checkCanFinalize();
  }, [checkIsTallied, pollId, publicClient, signer]);

  return canFinalize;
};
