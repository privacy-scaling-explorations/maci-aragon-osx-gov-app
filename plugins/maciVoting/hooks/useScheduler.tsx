import { useCallback, useEffect, useState } from "react";
import { useProposal } from "./useProposal";
import { useCoordinator } from "./useCoordinator";
import { usePublicClient } from "wagmi";
import { decodeEventLog, type Hex } from "viem";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";

export const useScheduler = () => {
  const [error, setError] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [proposalId, setProposalId] = useState<string>("");
  const [pollId, setPollId] = useState<number | null>(null);
  const [deploymentBlockNumber, setDeploymentBlockNumber] = useState<number | null>(null);

  const publicClient = usePublicClient();
  const { proposal } = useProposal(proposalId);
  const { schedulePollFinalization } = useCoordinator();

  useEffect(() => {
    if (proposal && proposal.pollId) {
      setPollId(Number(proposal.pollId));
    }
  }, [proposal]);

  useEffect(() => {
    if (proposalId === "" || !deploymentBlockNumber || !pollId) return;

    schedulePollFinalization({
      pollId,
      deploymentBlockNumber,
    })
      .then((result) => {
        setIsScheduled(result.success && result.data.isScheduled);
        setError(null);
      })
      .catch(() => {
        setIsScheduled(false);
        setError("Something went wrong with the coordinator service");
      });
  }, [proposalId, deploymentBlockNumber, pollId, schedulePollFinalization]);

  const setTxHash = useCallback(
    async (txHash: Hex) => {
      if (!publicClient) {
        setError("Public client not available");
        return;
      }

      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      if (!receipt) {
        setError("Transaction receipt not found");
        return;
      }

      const log = receipt.logs.find((log) => {
        try {
          decodeEventLog({
            eventName: "ProposalCreated",
            abi: MaciVotingAbi,
            data: log.data,
            topics: log.topics,
          });
          return true;
        } catch {
          return false;
        }
      });

      if (!log) {
        setError("ProposalCreated log not found in transaction receipt");
        return;
      }

      const args = decodeEventLog({
        eventName: "ProposalCreated",
        abi: MaciVotingAbi,
        data: log.data,
        topics: log.topics,
      }).args;

      setProposalId(args.proposalId.toString());
      setDeploymentBlockNumber(Number(receipt.blockNumber) ?? 0);
    },
    [publicClient]
  );

  return {
    isScheduled,
    error,
    setTxHash,
  };
};
