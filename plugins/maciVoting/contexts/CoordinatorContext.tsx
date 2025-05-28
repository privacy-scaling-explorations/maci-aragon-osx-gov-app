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
      return { success: false, error: new Error(`Failed to submit: ${errorMessage}`) };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: new Error(`Failed to merge: ${error}`),
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
        mode: EMode.NON_QV,
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

  const executeStep = useCallback(
    async <T,>(
      status: FinalizeStatus,
      step: "merge" | "prove" | "submit",
      func: () => Promise<TCoordinatorServiceResult<T>>
    ) => {
      setFinalizeStatus(status);
      const result = await func();
      if (!result.success) {
        setFinalizeStatus("notStarted");
        addAlert(`Failed to ${step}`, {
          description: `Failed to ${step}. Please try again.`,
          type: "error",
        });
        return;
      }

      const msg = {
        merge: ["Votes merged", "The votes have been merged."],
        prove: ["Votes proved", "The votes have been proved."],
        submit: ["Votes submitted", "The votes have been submitted."],
      } as const;

      addAlert(msg[step][0], { description: msg[step][1], type: "success" });
    },
    [addAlert]
  );

  const finalizeProposal = useCallback(
    async (pollId: number) => {
      if (!signer) {
        // eslint-disable-next-line no-console
        console.log("No signer");
        return;
      }

      const pollContracts = await getPollContracts({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });

      const isTallied = await pollContracts.tally.isTallied();
      if (isTallied) {
        console.log("Poll already finalized");
        setFinalizeStatus("notStarted");
        return;
      }

      const hasMerged = await checkMergeStatus(pollId).catch(() => setFinalizeStatus("notStarted"));
      if (!hasMerged) {
        await executeStep("merging", "merge", () => merge(pollId));
      }
      await executeStep("proving", "prove", () => generateProofs(pollId));
      await executeStep("submitting", "submit", () => submit(pollId));

      setFinalizeStatus("submitted");
      addAlert("Votes submitted", {
        description: "The votes have been submitted.",
        type: "success",
      });
      return;
    },
    [addAlert, checkMergeStatus, executeStep, generateProofs, merge, signer, submit]
  );

  const value = useMemo<ICoordinatorContextType>(
    () => ({
      finalizeStatus,
      finalizeProposal,
    }),
    [finalizeStatus, finalizeProposal]
  );

  return <CoordinatorContext.Provider value={value as ICoordinatorContextType}>{children}</CoordinatorContext.Provider>;
};
