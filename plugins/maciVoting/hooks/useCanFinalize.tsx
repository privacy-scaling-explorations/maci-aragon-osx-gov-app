import { useState, useEffect } from "react";
import { getPoll } from "@maci-protocol/sdk/browser";
import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { useEthersSigner } from "./useEthersSigner";
import { usePublicClient } from "wagmi";

export const useCanFinalize = (pollId?: bigint) => {
  const [canFinalize, setCanFinalize] = useState(false);

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

        setCanFinalize(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Error checking if poll can be finalized:", error);
        setCanFinalize(false);
      }
    };

    checkCanFinalize();
  }, [pollId, publicClient, signer]);

  return canFinalize;
};
