import { EMode } from "@maci-protocol/core";
import { getPoll, getPollContracts, Poll__factory as PollFactory } from "@maci-protocol/sdk/browser";
import {
  PUBLIC_CHAIN_NAME,
  PUBLIC_COORDINATOR_SERVICE_URL,
  PUBLIC_MACI_ADDRESS,
  PUBLIC_MACI_DEPLOYMENT_BLOCK,
} from "@/constants";
import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  type ICoordinatorServiceResult,
  type TGenerateResponse,
  type TSubmitResponse,
  type ICoordinatorContextType,
  type IGenerateProofsArgs,
  type FinalizeStatus,
} from "./types";
import { GenerateResponseSchema, SubmitResponseSchema } from "./schemas";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { getFutureBlockNumberAtTimestamp } from "../utils/blockAtTimestamp";
import { toBackendChainFormat } from "../utils/chains";

export const CoordinatorContext = createContext<ICoordinatorContextType | undefined>(undefined);

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>("notStarted");

  const signer = useEthersSigner();
  const account = useAccount();

  const merge = useCallback(async (pollId: number): Promise<ICoordinatorServiceResult<boolean>> => {
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
      data: Boolean(data), // zod is overkill for this
    };
  }, []);

  const generateProofs = useCallback(
    async ({
      pollId,
      startBlock,
      endBlock,
    }: IGenerateProofsArgs): Promise<ICoordinatorServiceResult<TGenerateResponse>> => {
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
            startBlock,
            endBlock,
            blocksPerBatch: 20,
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
        data: GenerateResponseSchema.parse(data),
      };
    },
    []
  );

  const submit = useCallback(async (pollId: number): Promise<ICoordinatorServiceResult<TSubmitResponse>> => {
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
      data: SubmitResponseSchema.parse(data),
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
        console.log("No signer");
        return;
      }

      // check if poll was already finalized
      const { tally } = await getPollContracts({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      const isTallied = await tally.isTallied();
      console.log(isTallied);
      if (isTallied) {
        console.log("Poll already finalized");
        return;
      }

      setFinalizeStatus("merging");
      const hasMerged = await checkMergeStatus(pollId);
      if (!hasMerged) {
        console.log("Not merged");
        const mergeResult = await merge(pollId);
        if (!mergeResult.success) {
          console.log("Failed to merge");
          return;
        }
      }
      console.log("Merged");
      setFinalizeStatus("merged");

      const { endDate } = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      const startBlock = PUBLIC_MACI_DEPLOYMENT_BLOCK;
      const endBlock = Number(await getFutureBlockNumberAtTimestamp(BigInt(endDate.toString())));

      console.log("Generating proofs");
      console.log("startBlock", startBlock);
      console.log("endBlock  ", endBlock);

      setFinalizeStatus("proving");
      const proveResult = await generateProofs({
        pollId,
        startBlock,
        endBlock,
      });
      if (!proveResult.success) {
        console.log("Failed to generate proofs");
        return;
      }
      setFinalizeStatus("proved");
      console.log("Proved");

      setFinalizeStatus("submitting");
      const submitResult = await submit(pollId);
      if (!submitResult.success) {
        console.log("Failed to submit");
        return;
      }
      setFinalizeStatus("submitted");
      console.log("Submitted");
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
