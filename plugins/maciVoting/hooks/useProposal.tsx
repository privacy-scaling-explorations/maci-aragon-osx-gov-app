import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { fromHex, getAbiItem, type Hex } from "viem";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";
import { type Action } from "@/utils/types";
import { type Proposal, type ProposalMetadata } from "@/plugins/maciVoting/utils/types";
import { PUBLIC_CHAIN, PUBLIC_MACI_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { useMetadata } from "@/hooks/useMetadata";

export type ProposalCreatedLogResponse = {
  args: {
    proposalId: bigint;
    creator: string;
    endDate: bigint;
    startDate: bigint;
    metadata: string;
    actions: Action[];
    allowFailureMap: bigint;
  };
};

export const ProposalCreatedEvent = getAbiItem({
  abi: MaciVotingAbi,
  name: "ProposalCreated",
});

export function useProposal(proposalId: string, autoRefresh = false) {
  const publicClient = usePublicClient({ chainId: PUBLIC_CHAIN.id });
  const [proposalCreationEvent, setProposalCreationEvent] = useState<ProposalCreatedLogResponse["args"]>();
  const [metadataUri, setMetadata] = useState<string>();

  // Proposal on-chain data
  const {
    data: proposalData,
    error: proposalError,
    fetchStatus: proposalFetchStatus,
    refetch: proposalRefetch,
    queryKey: proposalQueryKey,
  } = useReadContract({
    chainId: PUBLIC_CHAIN.id,
    address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
    abi: MaciVotingAbi,
    functionName: "getProposal",
    args: [BigInt(proposalId)],
    query: {
      refetchOnWindowFocus: true,
      refetchInterval: (data) => {
        return autoRefresh ? 10000 : false;
      },
    },
  });

  // Creation event
  useEffect(() => {
    (async () => {
      if (!proposalData || !publicClient) return;

      const snapshotBlock = BigInt(proposalData.parameters.snapshotBlock);

      try {
        const logs = await publicClient.getLogs({
          address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
          event: ProposalCreatedEvent,
          fromBlock: snapshotBlock,
          toBlock: snapshotBlock + 1n,
        });

        if (!logs || !logs.length) throw new Error("No creation logs");

        const filteredLogs = logs.filter((log) => log.args.proposalId === BigInt(proposalId));
        if (!filteredLogs.length) return;
        const log: ProposalCreatedLogResponse = filteredLogs[0] as any;

        setProposalCreationEvent(log.args);
        setMetadata(fromHex(log.args.metadata as Hex, "string"));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Could not fetch the proposal details", error);
      }
    })();
  }, [proposalData, proposalId, publicClient]);

  // JSON metadata
  const {
    data: metadataContent,
    isLoading: metadataLoading,
    error: metadataError,
  } = useMetadata<ProposalMetadata>(metadataUri);

  const arrangeProposalData = useCallback(
    (
      proposal?: typeof proposalData,
      creationEvent?: ProposalCreatedLogResponse["args"],
      metadata?: ProposalMetadata
    ): Proposal | null => {
      if (!proposal) return null;

      return {
        executed: proposal.executed,
        parameters: proposal.parameters,
        tally: {
          yes: proposal.tally.yes ?? 0n,
          no: proposal.tally.no ?? 0n,
          abstain: proposal.tally.abstain ?? 0n,
        },
        actions: [...proposal.actions],
        allowFailureMap: proposal.allowFailureMap,
        targetConfig: proposal.targetConfig,
        pollId: proposal.pollId,
        pollAddress: proposal.pollAddress,
      };
    },
    []
  );

  const proposal = arrangeProposalData(proposalData, proposalCreationEvent, metadataContent);

  return {
    proposal,
    proposalMetadata: metadataContent,
    creator: proposalCreationEvent?.creator,
    proposalQueryKey,
    proposalRefetch,
    status: {
      proposalReady: proposalFetchStatus === "idle",
      proposalLoading: proposalFetchStatus === "fetching",
      proposalError,
      metadataReady: !metadataError && !metadataLoading && !!metadataContent,
      metadataLoading,
      metadataError: metadataError !== undefined,
    },
  };
}
