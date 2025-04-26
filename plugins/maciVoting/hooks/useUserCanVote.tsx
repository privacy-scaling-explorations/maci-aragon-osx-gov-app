import { useAccount, useBlockNumber, useReadContract } from "wagmi";
import { TokenVotingAbi } from "@/plugins/maciVoting/artifacts/TokenVoting.sol";
import { useEffect } from "react";
import {
  PUB_CHAIN,
  PUB_L2_CHAIN,
  PUB_TOUCAN_VOTING_PLUGIN_ADDRESS,
  PUB_TOUCAN_VOTING_PLUGIN_L2_ADDRESS,
} from "@/constants";
import { useProposalRef } from "./useProposalRef";
import { ToucanRelayAbi } from "../artifacts/ToucanRelay.sol";

export function useUserCanVote(proposalId: string) {
  const canVoteL1 = useCanVoteL1(proposalId);
  const canVoteL2 = useCanVoteL2(proposalId);
  return canVoteL1 || canVoteL2;
}

export function useCanVoteL2(proposalId: string) {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  let refetch = 0;
  if (blockNumber ?? 0n % 10n === 0n) refetch++;

  const { proposalRef } = useProposalRef(Number(proposalId));

  const { data: canVote, refetch: refreshCanVoteL2 } = useReadContract({
    chainId: PUB_L2_CHAIN.id,
    address: PUB_TOUCAN_VOTING_PLUGIN_L2_ADDRESS,
    abi: ToucanRelayAbi,
    functionName: "canVote",
    args: [proposalRef!, address!, { abstain: 1n, yes: 0n, no: 0n }],
    query: { enabled: !!address && proposalRef !== undefined },
  });
  useEffect(() => {
    refreshCanVoteL2();
  }, [refetch]);
  return canVote;
}

export function useCanVoteL1(proposalId: string) {
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  let refetch = 0;
  if (blockNumber ?? 0n % 10n === 0n) refetch++;

  const { data: canVote, refetch: refreshCanVote } = useReadContract({
    chainId: PUB_CHAIN.id,
    address: PUB_TOUCAN_VOTING_PLUGIN_ADDRESS,
    abi: TokenVotingAbi,
    functionName: "canVote",
    args: [BigInt(proposalId), address!, { abstain: 1n, yes: 0n, no: 0n }],
    query: { enabled: !!address },
  });

  useEffect(() => {
    refreshCanVote();
  }, [refetch]);

  return canVote;
}
