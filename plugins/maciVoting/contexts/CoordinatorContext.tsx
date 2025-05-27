import { EMode } from "@maci-protocol/core";
import { getPoll, getPollContracts, type ITallyData, Poll__factory as PollFactory } from "@maci-protocol/sdk/browser";
import { PUBLIC_CHAIN_NAME, PUBLIC_COORDINATOR_SERVICE_URL, PUBLIC_MACI_ADDRESS } from "@/constants";
import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";
import {
  type TCoordinatorServiceResult,
  type IGenerateData,
  type ICoordinatorContextType,
  type IGenerateProofsArgs,
  type FinalizeStatus,
} from "./types";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { toBackendChainFormat } from "../utils/chains";

export const CoordinatorContext = createContext<ICoordinatorContextType | undefined>(undefined);

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>("notStarted");

  const signer = useEthersSigner();

  const merge = useCallback(async (pollId: number): Promise<TCoordinatorServiceResult<boolean>> => {
    let response: Response;
    try {
      response = await fetch(`${PUBLIC_COORDINATOR_SERVICE_URL}/proof/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maciContractAddress: PUBLIC_MACI_ADDRESS,
          pollId,
          chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
        }),
      });
    } catch (error) {
      return {
        success: false,
        error: new Error(`Failed to merge: ${error}`),
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message
        ? `${response.status} - ${response.statusText}. ${errorData.message}`
        : `${response.status} - ${response.statusText}`;

      return {
        success: false,
        error: new Error(`Failed to merge: ${errorMessage}`),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: Boolean(data),
    };
  }, []);

  const generateProofs = useCallback(
    async ({ pollId }: IGenerateProofsArgs): Promise<TCoordinatorServiceResult<IGenerateData>> => {
      let response: Response;
      try {
        response = await fetch(`${PUBLIC_COORDINATOR_SERVICE_URL}/proof/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            poll: pollId,
            maciContractAddress: PUBLIC_MACI_ADDRESS,
            mode: EMode.NON_QV,
            blocksPerBatch: 1000,
            chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
          }),
        });
      } catch (error) {
        return {
          success: false,
          error: new Error(`Failed to generate proofs: ${error}`),
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        const partialErrorMessage = errorData.message
          ? `${response.status} - ${response.statusText}. ${errorData.message}`
          : `${response.status} - ${response.statusText}`;

        return {
          success: false,
          error: new Error(`Failed to generate proofs: ${partialErrorMessage}`),
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    },
    []
  );

  const submit = useCallback(async (pollId: number): Promise<TCoordinatorServiceResult<ITallyData>> => {
    let response: Response;
    try {
      response = await fetch(`${PUBLIC_COORDINATOR_SERVICE_URL}/proof/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pollId,
          maciContractAddress: PUBLIC_MACI_ADDRESS,
          chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
        }),
      });
    } catch (error) {
      return {
        success: false,
        error: new Error(`Failed to submit: ${error}`),
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      const partialErrorMessage = errorData.message
        ? `${response.status} - ${response.statusText}. ${errorData.message}`
        : `${response.status} - ${response.statusText}`;

      return {
        success: false,
        error: new Error(`Failed to submit: ${partialErrorMessage}`),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
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

  const finalizeProposal = useCallback(
    async (pollId: number) => {
      if (!signer) {
        // eslint-disable-next-line no-console
        console.log("No signer");
        return;
      }

      // check if poll was already finalized
      // TODO: what should we do here?
      const pollContracts = await getPollContracts({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      }).catch(() => setFinalizeStatus("notStarted"));
      if (!pollContracts) {
        return;
      }
      const isTallied = await pollContracts.tally.isTallied();
      // eslint-disable-next-line no-console
      console.log("isTallied", isTallied);
      /*if (isTallied) {
        console.log("Poll already finalized");
        return;
      }*/

      setFinalizeStatus("merging");
      const hasMerged = await checkMergeStatus(pollId).catch(() => setFinalizeStatus("notStarted"));
      if (!hasMerged) {
        const mergeResult = await merge(pollId);
        if (!mergeResult.success) {
          setFinalizeStatus("notStarted");
          return;
        }
      }
      setFinalizeStatus("merged");

      setFinalizeStatus("proving");
      const proveResult = await generateProofs({
        pollId,
      });
      if (!proveResult.success) {
        setFinalizeStatus("notStarted");
        return;
      }
      setFinalizeStatus("proved");

      setFinalizeStatus("submitting");
      const submitResult = await submit(pollId);
      if (!submitResult.success) {
        setFinalizeStatus("notStarted");
        return;
      }
      setFinalizeStatus("submitted");
      return;
    },
    [checkMergeStatus, generateProofs, merge, signer, submit]
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
