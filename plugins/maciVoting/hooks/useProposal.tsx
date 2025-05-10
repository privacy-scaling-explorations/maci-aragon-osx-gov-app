import { useState, useEffect, useCallback } from "react";
import { useBlockNumber, usePublicClient, useReadContract } from "wagmi";
import { fromHex, getAbiItem, type Hex } from "viem";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";
import { type Action } from "@/utils/types";
import { type Proposal, type ProposalMetadata } from "@/plugins/maciVoting/utils/types";
import { PUB_CHAIN, PUB_MACI_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { useMetadata } from "@/hooks/useMetadata";
import { getCurrentBlock, getFutureBlockNumberAtTimestamp } from "../utils/blockAtTimestamp";

type ProposalCreatedLogResponse = {
  args: {
    actions: Action[];
    allowFailureMap: bigint;
    creator: string;
    endDate: bigint;
    startDate: bigint;
    metadata: string;
    proposalId: bigint;
  };
};

const ProposalCreatedEvent = getAbiItem({
  abi: MaciVotingAbi,
  name: "ProposalCreated",
});

export function useProposal(proposalId: string, autoRefresh = false) {
  const publicClient = usePublicClient({ chainId: PUB_CHAIN.id });
  const [proposalCreationEvent, setProposalCreationEvent] = useState<ProposalCreatedLogResponse["args"]>();
  const [metadataUri, setMetadata] = useState<string>();
  const { data: blockNumber } = useBlockNumber();

  // Proposal on-chain data
  const {
    data: proposalData,
    error: proposalError,
    fetchStatus: proposalFetchStatus,
    refetch: proposalRefetch,
    queryKey: proposalQueryKey,
  } = useReadContract({
    chainId: PUB_CHAIN.id,
    address: PUB_MACI_VOTING_PLUGIN_ADDRESS,
    abi: MaciVotingAbi,
    functionName: "getProposal",
    args: [BigInt(proposalId)],
  });

  useEffect(() => {
    if (autoRefresh) proposalRefetch();
  }, [autoRefresh, blockNumber, proposalRefetch]);

  // Creation event
  useEffect(() => {
    (async () => {
      if (!proposalData || !publicClient) return;

      const snapshotBlock = BigInt(proposalData.parameters.snapshotBlock);
      const startBlock = await getFutureBlockNumberAtTimestamp(proposalData.parameters.startDate);
      const currentBlock = (await getCurrentBlock()).number;

      const minimumToBlock = BigInt(Math.min(Number(startBlock), Number(currentBlock)));

      try {
        const logs = await publicClient.getLogs({
          address: PUB_MACI_VOTING_PLUGIN_ADDRESS,
          event: ProposalCreatedEvent as any,
          fromBlock: snapshotBlock,
          toBlock: minimumToBlock,
        });

        if (!logs || !logs.length) throw new Error("No creation logs");

        const log: ProposalCreatedLogResponse = logs[0] as any;

        setProposalCreationEvent(log.args);
        setMetadata(fromHex(log.args.metadata as Hex, "string"));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Could not fetch the proposal details", error);
      }
    })();
  }, [proposalData, publicClient]);

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
        actions: [...proposal.actions],
        active: proposal.active,
        executed: proposal.executed,
        parameters: proposal.parameters,
        tally: {
          yes: proposal.tally.yes ?? 0n,
          no: proposal.tally.no ?? 0n,
          abstain: proposal.tally.abstain ?? 0n,
        },
        allowFailureMap: proposal.allowFailureMap,
        creator: creationEvent?.creator ?? "",
        title: metadata?.title ?? "",
        summary: metadata?.summary ?? "",
        description: metadata?.description ?? "",
        resources: metadata?.resources ?? [],
        pollId: proposal.pollId,
      };
    },
    []
  );

  const proposal = arrangeProposalData(proposalData, proposalCreationEvent, metadataContent);

  return {
    proposal,
    proposalQueryKey,
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
