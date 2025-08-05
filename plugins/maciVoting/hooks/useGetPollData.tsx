import { PUBLIC_CHAIN, PUBLIC_MACI_ADDRESS } from "@/constants";
import { getPoll, getResults, isTallied, type IResult } from "@maci-protocol/sdk/browser";
import { useQuery, type Query } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { clientToSigner, useEthersSigner } from "./useEthersSigner";

export const useGetPollData = (pollId?: string | bigint) => {
  const signer = useEthersSigner();
  const publicClient = usePublicClient({ chainId: PUBLIC_CHAIN.id });

  return useQuery({
    enabled: !!signer,
    queryKey: [
      "get-poll-data",
      {
        pollId: String(pollId),
        signerAddress: publicClient?.account,
      },
    ],
    queryFn: async () => {
      if (!publicClient) return;

      const publicSigner = clientToSigner(publicClient);

      const poll = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer: publicSigner,
      });

      let tallied = false;
      let results: IResult[] | undefined = undefined;

      const voteEndDate = Number(poll.endDate.toString());
      const voteStartDate = Number(poll.startDate.toString());
      const now = Math.round(Date.now() / 1000);
      const voteEnded = voteEndDate < now;
      const disabled = voteEnded || voteStartDate > Math.round(Date.now() / 1000);

      // fetch results only if the poll is tallied
      if (voteEnded && signer && pollId) {
        try {
          tallied = await isTallied({
            maciAddress: PUBLIC_MACI_ADDRESS,
            pollId: pollId.toString(),
            signer: publicSigner,
          });

          if (tallied) {
            results = await getResults({
              maciAddress: PUBLIC_MACI_ADDRESS,
              pollId: pollId.toString(),
              signer: publicSigner,
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error);
        }

        const blockNumber = await publicSigner.provider.getBlockNumber();
        console.log("🔍 Current block number:", blockNumber);

        console.log("pollId", pollId);
        console.log("voteEnded", voteEnded);
        console.log("tallied", tallied);
        console.log("results", results);
        console.log("date", new Date());
      }

      return {
        voteStartDate,
        voteEndDate,
        now,
        voteEnded,
        disabled,
        tallied,
        results,
      };
    },
    // refetch every 10 seconds if the vote is not ended
    refetchInterval: ({ state }: Query<any, any, any, any>) => {
      return state?.data?.tallied ? false : 10 * 1000;
    },
    refetchOnWindowFocus: true,
  });
};
