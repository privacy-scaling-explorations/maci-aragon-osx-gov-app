import { type KeyLike } from "crypto";
import { Poll__factory as PollFactory } from "@maci-protocol/contracts";
import { EMode } from "@maci-protocol/core";
import { getPoll } from "@maci-protocol/sdk/browser";
import {
  PUBLIC_CHAIN,
  PUBLIC_COORDINATOR_SERVICE_URL,
  PUBLIC_MACI_ADDRESS,
  PUBLIC_MACI_DEPLOYMENT_BLOCK,
  PUBLIC_WEB3_ENDPOINT,
} from "@/constants";
import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";
import { createPublicClient, hashMessage, http, parseAbi, toBytes } from "viem";
import { useSignMessage } from "wagmi";
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
      const publicKey = await getPublicKey();
      const encryptedHeader = await getAuthorizationHeader(publicKey);

      const response = await fetch(`${baseUrl}/proof/merge`, {
        method: "POST",
        headers: {
          Authorization: encryptedHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maciContractAddress,
          pollId,
          chain: publicClient.chain.id,
        }),
      });

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
      encryptedCoordinatorPrivateKey,
      startBlock,
      endBlock,
    }: IGenerateProofsArgs): Promise<ICoordinatorServiceResult<TGenerateResponse>> => {
      const publicKey = await getPublicKey();
      const encryptedHeader = await getAuthorizationHeader(publicKey);

      const response = await fetch(`${baseUrl}/proof/generate`, {
        method: "POST",
        headers: {
          Authorization: encryptedHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poll: pollId,
          maciContractAddress,
          mode: EMode.NON_QV,
          encryptedCoordinatorPrivateKey,
          startBlock,
          endBlock,
          blocksPerBatch: 20,
          chain: publicClient.chain.id,
        }),
      });

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
      const publicKey = await getPublicKey();
      const encryptedHeader = await getAuthorizationHeader(publicKey);

      const response = await fetch(`${baseUrl}/proof/submit`, {
        method: "POST",
        headers: {
          Authorization: encryptedHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pollId,
          maciContractAddress,
          chain: publicClient.chain.id,
        }),
      });

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
    const { address: pollAddress } = await getPoll({
      maciAddress: PUBLIC_MACI_ADDRESS,
      pollId,
      signer,
    });
    const poll = PollFactory.connect(pollAddress, signer);
    return await poll.stateMerged();
  };

  const finalizeProposal = useCallback(async (pollId: number) => {
    setFinalizeStatus("merging");
    const hasMerged = await checkMergeStatus(pollId);
    if (!hasMerged) {
      const mergeResult = await merge(pollId);
      if (!mergeResult.success) {
        return;
      }
    }
    setFinalizeStatus("merged");

    const { address: pollAddress } = await getPoll({
      maciAddress: PUBLIC_MACI_ADDRESS,
      pollId,
      signer,
    });
    const poll = PollFactory.connect(pollAddress, signer);
    const endDate = await poll.endDate();
    const encryptedCoordinatorPrivateKey = "";
    const startBlock = PUBLIC_MACI_DEPLOYMENT_BLOCK;
    const endBlock = Number(await getFutureBlockNumberAtTimestamp(endDate));

    setFinalizeStatus("proving");
    const proveResult = await generateProofs({
      pollId,
      encryptedCoordinatorPrivateKey,
      startBlock,
      endBlock,
    });
    if (!proveResult.success) {
      return;
    }
    setFinalizeStatus("proved");

    setFinalizeStatus("submitting");
    const submitResult = await submit(pollId);
    if (!submitResult.success) {
      return;
    }
    setFinalizeStatus("submitted");
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
