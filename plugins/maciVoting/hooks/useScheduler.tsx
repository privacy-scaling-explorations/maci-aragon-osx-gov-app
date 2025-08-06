import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { decodeEventLog, type Hex } from "viem";
import { EMode } from "@maci-protocol/core";
import { useProposal } from "./useProposal";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";
import {
  type ISchedulePollArgs,
  type ISchedulePollFinalizationData,
  type TCoordinatorServiceResult,
} from "../contexts/types";
import {
  PUBLIC_CHAIN_NAME,
  PUBLIC_COORDINATOR_SERVICE_URL,
  PUBLIC_MACI_ADDRESS,
  PUBLIC_MACI_DEPLOYMENT_BLOCK,
} from "@/constants";
import { toBackendChainFormat } from "../utils/chains";

export const useScheduler = () => {
  const [error, setError] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [proposalId, setProposalId] = useState<string>("");
  const [pollId, setPollId] = useState<number | null>(null);
  const [deploymentBlockNumber, setDeploymentBlockNumber] = useState<number | null>(null);

  const publicClient = usePublicClient();
  const { proposal } = useProposal(proposalId);

  const makeCoordinatorServicePostRequest = useCallback(
    async (url: string, body: string): Promise<TCoordinatorServiceResult<ISchedulePollFinalizationData>> => {
      const type = url.split("/").pop() ?? "finalize";
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message
            ? `${response.status} - ${response.statusText}. ${errorData.message}`
            : `${response.status} - ${response.statusText}`;
          return { success: false, error: new Error(`Failed to ${type} proofs: ${errorMessage}`) };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return {
          success: false,
          error: new Error(`Failed to ${type}: ${error}`),
        };
      }
    },
    []
  );

  const schedulePollFinalization = useCallback(
    async (poll: ISchedulePollArgs) => {
      return makeCoordinatorServicePostRequest(
        `${PUBLIC_COORDINATOR_SERVICE_URL}/scheduler/register`,
        JSON.stringify({
          maciAddress: PUBLIC_MACI_ADDRESS,
          pollId: poll.pollId,
          chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
          deploymentBlockNumber: PUBLIC_MACI_DEPLOYMENT_BLOCK,
          mode: EMode.FULL,
        })
      );
    },
    [makeCoordinatorServicePostRequest]
  );

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
      setDeploymentBlockNumber(Number(receipt.blockNumber));
    },
    [publicClient]
  );

  return {
    isScheduled,
    error,
    setTxHash,
  };
};
