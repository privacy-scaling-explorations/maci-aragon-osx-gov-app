import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { getPoll, getResults, type IResult } from "@maci-protocol/sdk/browser";
import { useEffect, useState } from "react";
import { useEthersSigner } from "./useEthersSigner";
import { useCoordinator } from "./useCoordinator";

export const useResults = (pollId?: bigint) => {
  const { checkIsTallied } = useCoordinator();
  const signer = useEthersSigner();

  const [results, setResults] = useState<IResult[] | undefined>(undefined);
  const [tallied, setTallied] = useState(false);

  useEffect(() => {
    (async () => {
      if (!signer || !pollId) {
        return;
      }

      const { endDate } = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      const now = Math.round(Date.now() / 1000);

      const voteEnded = Number(endDate) < now;
      if (!voteEnded) {
        setTallied(false);
        return;
      }

      const isTallied = await checkIsTallied(Number(pollId));
      setTallied(isTallied);
    })();
  }, [checkIsTallied, pollId, signer]);

  useEffect(() => {
    (async () => {
      if (!signer || !pollId) {
        return;
      }

      if (!tallied) {
        return;
      }

      try {
        const resultsData = await getResults({
          maciAddress: PUBLIC_MACI_ADDRESS,
          pollId: pollId.toString(),
          signer,
        });

        setResults(resultsData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching results:", err);
      }
    })();
  }, [pollId, signer, checkIsTallied, tallied]);

  return { results, tallied };
};
