import { type KeyLike } from "crypto";
import { EMode } from "@maci-protocol/sdk";
import { createContext, type ReactNode, useCallback, useMemo } from "react";
import { hashMessage, toBytes } from "viem";
import { usePublicClient, useSignMessage } from "wagmi";
import {
  type CoordinatorServiceResult,
  type GenerateResponse,
  type SubmitResponse,
  type CoordinatorContextType,
} from "./types";
import { encryptWithCoordinatorRSA } from "./auth";
import { GenerateResponseSchema, SubmitResponseSchema } from "./schemas";

// TODO: move to env
const BASE_URL = "http://localhost:3000/v1";
const MACI_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CoordinatorContext = createContext<CoordinatorContextType | undefined>(undefined);

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();

  const getPublicKey = async (): Promise<KeyLike> => {
    const response = await fetch(`${BASE_URL}/proof/publicKey`, {
      method: "GET",
    });
    const body = await response.json();
    return body.publicKey;
  };

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
    async (pollId: number): Promise<CoordinatorServiceResult<boolean>> => {
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

      const publicKey = await getPublicKey();
      const encryptedHeader = await getAuthorizationHeader(publicKey);

      let response: Response;
      try {
        response = await fetch(`${BASE_URL}/proof/merge`, {
          method: "POST",
          headers: {
            Authorization: encryptedHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            maciContractAddress: MACI_CONTRACT_ADDRESS,
            pollId,
            chain: publicClient.chain.id,
          }),
        });
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
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
    [getAuthorizationHeader, publicClient]
  );

  const generateProofs = useCallback(
    async (
      pollId: number,
      encryptedCoordinatorPrivateKey: string
    ): Promise<CoordinatorServiceResult<GenerateResponse>> => {
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

      const publicKey = await getPublicKey();
      const encryptedHeader = await getAuthorizationHeader(publicKey);
      const blockNumber = await publicClient.getBlockNumber();

      let response: Response;
      try {
        response = await fetch(`${BASE_URL}/proof/generate`, {
          method: "POST",
          headers: {
            Authorization: encryptedHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            poll: pollId,
            maciContractAddress: MACI_CONTRACT_ADDRESS,
            mode: EMode.NON_QV,
            encryptedCoordinatorPrivateKey,
            startBlock: Number(blockNumber) - 100,
            endBlock: Number(blockNumber) + 100,
            blocksPerBatch: 20,
            chain: publicClient?.chain.id,
          }),
        });
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
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
    [getAuthorizationHeader, publicClient]
  );

  const submit = useCallback(
    async (pollId: number): Promise<CoordinatorServiceResult<SubmitResponse>> => {
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

      const publicKey = await getPublicKey();
      const encryptedHeader = await getAuthorizationHeader(publicKey);

      let response: Response;
      try {
        response = await fetch(`${BASE_URL}/proof/submit`, {
          method: "POST",
          headers: {
            Authorization: encryptedHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pollId,
            maciContractAddress: MACI_CONTRACT_ADDRESS,
            chain: publicClient.chain.id,
          }),
        });
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
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
    [getAuthorizationHeader, publicClient]
  );

  const value = useMemo<CoordinatorContextType>(
    () => ({
      merge,
      generateProofs,
      submit,
    }),
    [merge, generateProofs, submit]
  );

  return <CoordinatorContext.Provider value={value as CoordinatorContextType}>{children}</CoordinatorContext.Provider>;
};
