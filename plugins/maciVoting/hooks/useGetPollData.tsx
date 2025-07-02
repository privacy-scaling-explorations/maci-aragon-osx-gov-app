import { Query, useQuery } from "@tanstack/react-query";
import { getPoll, getResults, type IResult } from "@maci-protocol/sdk/browser";
import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { useCoordinator } from "./useCoordinator";
import { useEthersSigner } from "./useEthersSigner";

export const useGetPollData = (pollId?: string | bigint) => {
  const { checkIsTallied } = useCoordinator();
  const signer = useEthersSigner();

  return useQuery({
    enabled: !!signer,
    queryKey: [
      "get-poll-data",
      {
        pollId: String(pollId),
        signerAddress: signer?.address,
      },
    ],
    queryFn: async () => {
      const poll = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });

      let tallied = false;
      let results: IResult[] | undefined = undefined;

      const voteEndDate = Number(poll.endDate.toString());
      const voteStartDate = Number(poll.startDate.toString());
      const now = Math.round(Date.now() / 1000);
      const voteEnded = voteEndDate < now;
      const disabled = voteEnded || voteStartDate > Math.round(Date.now() / 1000);

      // fetch results only if the vote has ended
      if (voteEnded && signer && pollId) {
        try {
          tallied = await checkIsTallied(Number(pollId));
          if (tallied) {
            results = await getResults({
              maciAddress: PUBLIC_MACI_ADDRESS,
              pollId: pollId.toString(),
              signer,
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error);
        }
      }

      return {
        voteStartDate,
        voteEndDate,
        now,
        voteEnded,
        disabled,
        tallied: true,
        results,
      };
    },
    // refetch every 10 seconds if the vote is not ended
    refetchInterval: ({ state }: Query<any, any, any, any>) => {
      return state?.data?.voteEnded ? false : 10000;
    },
    refetchOnWindowFocus: true,
  });
};
