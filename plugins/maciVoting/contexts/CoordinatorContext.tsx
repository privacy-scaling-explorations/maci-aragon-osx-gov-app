import { type KeyLike } from "crypto";
import { EMode } from "@maci-protocol/core";
import { getPoll, Poll__factory as PollFactory } from "@maci-protocol/sdk/browser";
import {
  PUBLIC_CHAIN,
  PUBLIC_COORDINATOR_SERVICE_URL,
  PUBLIC_MACI_ADDRESS,
  PUBLIC_MACI_DEPLOYMENT_BLOCK,
  PUBLIC_WEB3_ENDPOINT,
} from "@/constants";
import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";
import { createPublicClient, hashMessage, http, parseAbi, toBytes } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import {
  type ICoordinatorServiceResult,
  type TGenerateResponse,
  type TSubmitResponse,
  type ICoordinatorContextType,
  IGenerateProofsArgs,
  FinalizeStatus,
} from "./types";
import { encryptWithCoordinatorRSA } from "./auth";
import { GenerateResponseSchema, SubmitResponseSchema } from "./schemas";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { getFutureBlockNumberAtTimestamp } from "../utils/blockAtTimestamp";

const baseUrl = PUBLIC_COORDINATOR_SERVICE_URL;
const maciContractAddress = PUBLIC_MACI_ADDRESS;

export const CoordinatorContext = createContext<ICoordinatorContextType | undefined>(undefined);

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>("notStarted");

  const publicClient = createPublicClient({
    chain: PUBLIC_CHAIN,
    transport: http(PUBLIC_WEB3_ENDPOINT),
  });
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();
  const account = useAccount();

  const getPublicKey = useCallback(async (): Promise<KeyLike> => {
    const response = await fetch(`${baseUrl}/proof/publicKey`, {
      method: "GET",
    });
    const body = await response.json();
    return body.publicKey;
  }, []);

  const getAuthorizationHeader = useCallback(
    async (publicKey: KeyLike): Promise<string> => {
      const signature = await signMessageAsync({
        message: "message",
      });
      const digest = Buffer.from(toBytes(hashMessage("message"))).toString("hex");
      const encrypted = encryptWithCoordinatorRSA(publicKey, `${signature}:${digest}`);
      return `Bearer ${encrypted}`;
    },
    [signMessageAsync]
  );

  const merge = useCallback(
    async (pollId: number): Promise<ICoordinatorServiceResult<boolean>> => {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/proof/merge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            maciContractAddress,
            pollId,
            chain: "sepolia",
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
    },
    [getAuthorizationHeader, getPublicKey, publicClient]
  );

  const generateProofs = useCallback(
    async ({
      pollId,
      startBlock,
      endBlock,
    }: IGenerateProofsArgs): Promise<ICoordinatorServiceResult<TGenerateResponse>> => {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/proof/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            poll: pollId,
            maciContractAddress,
            mode: EMode.NON_QV,
            startBlock,
            endBlock,
            blocksPerBatch: 20,
            chain: "sepolia",
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
    [getAuthorizationHeader, getPublicKey, publicClient]
  );

  const submit = useCallback(
    async (pollId: number): Promise<ICoordinatorServiceResult<TSubmitResponse>> => {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/proof/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pollId,
            maciContractAddress,
            chain: "sepolia",
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
    },
    [getAuthorizationHeader, getPublicKey, publicClient]
  );

  const checkMergeStatus = async (pollId: number) => {
    if (!signer) {
      return false;
    }
    const { address: pollAddress } = await getPoll({
      maciAddress: PUBLIC_MACI_ADDRESS,
      pollId,
      signer,
    });
    const poll = PollFactory.connect(pollAddress, signer);
    return await poll.stateMerged();
  };

  const finalizeProposal = useCallback(async (pollId: number) => {
    console.log("account", account);
    if (!signer) {
      console.log("No signer");
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

    const { address: pollAddress } = await getPoll({
      maciAddress: PUBLIC_MACI_ADDRESS,
      pollId,
      signer,
    });
    const poll = PollFactory.connect(pollAddress, signer);
    const endDate = await poll.endDate();
    const startBlock = PUBLIC_MACI_DEPLOYMENT_BLOCK;
    const endBlock = Number(await getFutureBlockNumberAtTimestamp(endDate));

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
  }, []);

  const value = useMemo<ICoordinatorContextType>(
    () => ({
      finalizeStatus,
      finalizeProposal,
    }),
    [finalizeStatus, finalizeProposal]
  );

  return <CoordinatorContext.Provider value={value as ICoordinatorContextType}>{children}</CoordinatorContext.Provider>;
};
