import { type KeyLike } from "crypto";
import { EMode } from "@maci-protocol/core";
import { PUBLIC_COORDINATOR_SERVICE_URL, PUBLIC_MACI_ADDRESS } from "@/constants";
import { createContext, type ReactNode, useCallback, useMemo } from "react";
import { hashMessage, toBytes } from "viem";
import { usePublicClient, useSignMessage } from "wagmi";
import {
  type ICoordinatorServiceResult,
  type TGenerateResponse,
  type TSubmitResponse,
  type ICoordinatorContextType,
  IGenerateProofsArgs,
} from "./types";
import { encryptWithCoordinatorRSA } from "./auth";
import { GenerateResponseSchema, SubmitResponseSchema } from "./schemas";

const baseUrl = PUBLIC_COORDINATOR_SERVICE_URL;
const maciContractAddress = PUBLIC_MACI_ADDRESS;

export const CoordinatorContext = createContext<ICoordinatorContextType | undefined>(undefined);

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();

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
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

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
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

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
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

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

  const value = useMemo<ICoordinatorContextType>(
    () => ({
      merge,
      generateProofs,
      submit,
    }),
    [merge, generateProofs, submit]
  );

  return <CoordinatorContext.Provider value={value as ICoordinatorContextType}>{children}</CoordinatorContext.Provider>;
};
