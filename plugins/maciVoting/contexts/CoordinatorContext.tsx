import { EMode } from "@maci-protocol/sdk";
import { createContext, type ReactNode, useCallback, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { useEthersSigner } from "../hooks/useEthersSigner";
import {
  type CoordinatorServiceResult,
  type GenerateResponse,
  type SubmitResponse,
  type CoordinatorContextType,
} from "./types";
import { getAuthorizationHeader } from "./auth";
import { GenerateResponseSchema, SubmitResponseSchema } from "./schemas";

// TODO: move to env
const BASE_URL = "http://localhost:3000/v1";
const MACI_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CoordinatorContext = createContext<CoordinatorContextType | undefined>(undefined);

export const CoordinatorProvider = ({ children }: { children: ReactNode }) => {
  const signer = useEthersSigner();
  const publicClient = usePublicClient();

  const merge = useCallback(
    async (pollId: number): Promise<CoordinatorServiceResult<boolean>> => {
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

      const encryptedHeader = await getAuthorizationHeader(signer);

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
    [publicClient, signer]
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

      const encryptedHeader = await getAuthorizationHeader(signer);
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
    [publicClient, signer]
  );

  const submit = useCallback(
    async (pollId: number): Promise<CoordinatorServiceResult<SubmitResponse>> => {
      if (!publicClient) {
        return {
          success: false,
          error: new Error("Public client not found"),
        };
      }

      const encryptedHeader = await getAuthorizationHeader(signer);

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
    [publicClient, signer]
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
