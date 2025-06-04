import { useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract, useReadContract } from "wagmi";
import { type AlertContextProps, useAlerts } from "@/context/Alerts";
import { useRouter } from "next/router";
import { PUBLIC_CHAIN, PUBLIC_MACI_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";

export function useProposalExecute(proposalId: string) {
  const { reload } = useRouter();
  const { addAlert } = useAlerts() as AlertContextProps;

  const {
    data: canExecute,
    isError: isCanVoteError,
    isLoading: isCanVoteLoading,
  } = useReadContract({
    address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
    abi: MaciVotingAbi,
    chainId: PUBLIC_CHAIN.id,
    functionName: "canExecute",
    args: [BigInt(proposalId)],
  });
  console.log("useProposalExecute proposalId", proposalId);
  console.log("useProposalExecute canExecute", canExecute);

  const {
    writeContract: executeWrite,
    data: executeTxHash,
    error: executingError,
    status: executingStatus,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: executeTxHash });

  const executeProposal = () => {
    if (!canExecute) return;

    executeWrite({
      address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
      abi: MaciVotingAbi,
      chainId: PUBLIC_CHAIN.id,
      functionName: "execute",
      args: [BigInt(proposalId)],
    });
  };

  useEffect(() => {
    if (executingStatus === "idle" || executingStatus === "pending") return;
    else if (executingStatus === "error") {
      if (executingError?.message?.startsWith("User rejected the request")) {
        addAlert("Transaction rejected by the user", {
          timeout: 4 * 1000,
        });
      } else {
        // eslint-disable-next-line no-console
        console.error(executingError);
        addAlert("Could not execute the proposal", {
          type: "error",
          description: "The proposal may contain actions with invalid operations",
        });
      }
      return;
    }

    // success
    if (!executeTxHash) return;
    else if (isConfirming) {
      addAlert("Proposal submitted", {
        description: "Waiting for the transaction to be validated",
        type: "info",
        txHash: executeTxHash,
      });
      return;
    } else if (!isConfirmed) return;

    addAlert("Proposal executed", {
      description: "The transaction has been validated",
      type: "success",
      txHash: executeTxHash,
    });

    setTimeout(() => reload(), 1000 * 2);
  }, [executingStatus, executeTxHash, isConfirming, isConfirmed, addAlert, executingError, reload]);

  return {
    executeProposal,
    canExecute: !isCanVoteError && !isCanVoteLoading && !isConfirmed && !!canExecute,
    isConfirming,
    isConfirmed,
  };
}
