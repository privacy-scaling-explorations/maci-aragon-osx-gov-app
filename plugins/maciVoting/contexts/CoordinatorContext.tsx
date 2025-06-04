import { EMode } from "@maci-protocol/core";
import { getPoll, getPollContracts, type ITallyData, Poll__factory as PollFactory } from "@maci-protocol/sdk/browser";
import { PUBLIC_CHAIN_NAME, PUBLIC_COORDINATOR_SERVICE_URL, PUBLIC_MACI_ADDRESS } from "@/constants";
import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";
import {
  type TCoordinatorServiceResult,
  type IGenerateData,
  type ICoordinatorContextType,
  type FinalizeStatus,
} from "./types";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { toBackendChainFormat } from "../utils/chains";
import { useAlerts } from "@/context/Alerts";

export const CoordinatorContext = createContext<ICoordinatorContextType | undefined>(undefined);

async function makeCoordinatorServicePostRequest<T>(url: string, body: string): Promise<TCoordinatorServiceResult<T>> {
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
}

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>("notStarted");

  const signer = useEthersSigner();
  const { addAlert } = useAlerts();

  const merge = useCallback(async (pollId: number): Promise<TCoordinatorServiceResult<boolean>> => {
    return await makeCoordinatorServicePostRequest<boolean>(
      `${PUBLIC_COORDINATOR_SERVICE_URL}/proof/merge`,
      JSON.stringify({
        maciContractAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
      })
    );
  }, []);

  const generateProofs = useCallback(async (pollId: number): Promise<TCoordinatorServiceResult<IGenerateData>> => {
    return await makeCoordinatorServicePostRequest<IGenerateData>(
      `${PUBLIC_COORDINATOR_SERVICE_URL}/proof/generate`,
      JSON.stringify({
        poll: pollId,
        maciContractAddress: PUBLIC_MACI_ADDRESS,
        mode: EMode.FULL,
        blocksPerBatch: 1000,
        chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
      })
    );
  }, []);

  const submit = useCallback(async (pollId: number): Promise<TCoordinatorServiceResult<ITallyData>> => {
    return await makeCoordinatorServicePostRequest<ITallyData>(
      `${PUBLIC_COORDINATOR_SERVICE_URL}/proof/submit`,
      JSON.stringify({
        pollId,
        maciContractAddress: PUBLIC_MACI_ADDRESS,
        chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
      })
    );
  }, []);

  const checkMergeStatus = useCallback(
    async (pollId: number) => {
      const { address: pollAddress } = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      const poll = PollFactory.connect(pollAddress, signer);
      return await poll.stateMerged();
    },
    [signer]
  );

  const checkIsTallied = useCallback(
    async (pollId: number) => {
      if (!signer) {
        // eslint-disable-next-line no-console
        console.log("checkIsTallied No signer");
        return false;
      }

      const pollContracts = await getPollContracts({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      const isTallied = await pollContracts.tally.isTallied();
      console.log("checkIsTallied isTallied", isTallied);
      return isTallied;
    },
    [signer]
  );

  const finalizeProposal = useCallback(
    async (pollId: number) => {
      if (!signer) {
        // eslint-disable-next-line no-console
        console.log("No signer");
      }

      const isTallied = await checkIsTallied(pollId);
      if (isTallied) {
        setFinalizeStatus("notStarted");
        return;
      }

      const hasMerged = await checkMergeStatus(pollId).catch(() => setFinalizeStatus("notStarted"));
      if (!hasMerged) {
        setFinalizeStatus("merging");
        const mergeResult = await merge(pollId);
        if (!mergeResult.success) {
          setFinalizeStatus("notStarted");
          addAlert("Failed to merge", {
            description: "Failed to merge. Please try again.",
            type: "error",
          });
          return;
        }
        addAlert("Poll merged", {
          description: "The poll has been merged.",
          type: "success",
        });
      }

      setFinalizeStatus("proving");
      const proveResult = await generateProofs(pollId);
      if (!proveResult.success) {
        setFinalizeStatus("notStarted");
        addAlert("Failed to generate proofs", {
          description: "Failed to generate proofs. Please try again.",
          type: "error",
        });
        return;
      }
      addAlert("Proofs generated", {
        description: "The proofs have been generated.",
        type: "success",
      });

      setFinalizeStatus("submitting");
      const submitResult = await submit(pollId);
      if (!submitResult.success) {
        setFinalizeStatus("notStarted");
        addAlert("Failed to submit proofs", {
          description: "Failed to submit proofs. Please try again.",
          type: "error",
        });
        return;
      }
      addAlert("Votes submitted", {
        description: "The votes have been submitted.",
        type: "success",
      });

      setFinalizeStatus("submitted");
      return;
    },
    [addAlert, checkIsTallied, checkMergeStatus, generateProofs, merge, signer, submit]
  );

  const value = useMemo<ICoordinatorContextType>(
    () => ({
      finalizeStatus,
      checkIsTallied,
      finalizeProposal,
    }),
    [finalizeStatus, checkIsTallied, finalizeProposal]
  );

  return <CoordinatorContext.Provider value={value as ICoordinatorContextType}>{children}</CoordinatorContext.Provider>;
};
