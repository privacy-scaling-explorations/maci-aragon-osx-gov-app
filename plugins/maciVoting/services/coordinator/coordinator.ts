import { type Address } from "viem";
import { type z } from "zod";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { ESupportedNetworks } from "./utils/networks";
import { type IGenerateArgs, type ISubmitProofsArgs } from "./utils/types";
import { getAuthorizationHeader, encryptWithCoordinatorRSAPublicKey } from "./utils/auth";
import { getSigner, getPublicClient } from "./utils/chain";
import { pollDeploymentConfig } from "./config";
import { GenerateResponseSchema, SubmitResponseSchema } from "./utils/schemas";

const BASE_URL = "http://localhost:3000/v1"; // TODO:
const CHAIN = ESupportedNetworks.OPTIMISM_SEPOLIA; // TODO:

type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
type SubmitResponse = z.infer<typeof SubmitResponseSchema>;
type CoordinatorServiceResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

const signer = getSigner(CHAIN);
const encryptedHeader = await getAuthorizationHeader(signer);
const publicClient = getPublicClient(CHAIN);

/**
 * Coordinator MACI Keypair
 */
// TODO:
export const coordinatorMACIKeypair = new Keypair(
  PrivateKey.deserialize("macisk.bdd73f1757f75261a0c9997def6cd47519cad2856347cdc6fd30718999576860")
);

export const merge = async (
  maciContractAddress: Address,
  pollId: number,
  approval: string,
  sessionKeyAddress: Address
): Promise<CoordinatorServiceResult<boolean>> => {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/proof/merge`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maciContractAddress,
        pollId,
        approval,
        sessionKeyAddress,
        chain: CHAIN,
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
};

export const generateProofs = async (
  pollId: number,
  maciContractAddress: Address,
  approval: string,
  sessionKeyAddress: Address
): Promise<CoordinatorServiceResult<GenerateResponse>> => {
  const coordinatorMACIKeypair = new Keypair(
    PrivateKey.deserialize("macisk.bdd73f1757f75261a0c9997def6cd47519cad2856347cdc6fd30718999576860")
  );

  const blockNumber = await publicClient.getBlockNumber();
  const encryptedCoordinatorPrivateKey = await encryptWithCoordinatorRSAPublicKey(
    coordinatorMACIKeypair.privateKey.serialize()
  );

  const args: IGenerateArgs = {
    poll: pollId,
    maciContractAddress,
    mode: pollDeploymentConfig.mode,
    encryptedCoordinatorPrivateKey,
    startBlock: Number(blockNumber) - 100,
    endBlock: Number(blockNumber) + 100,
    blocksPerBatch: 20,
    approval,
    sessionKeyAddress,
    chain: CHAIN,
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/proof/generate`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
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
};

export const submit = async (
  pollId: number,
  maciContractAddress: Address,
  approval: string,
  sessionKeyAddress: Address
): Promise<CoordinatorServiceResult<SubmitResponse>> => {
  const args: ISubmitProofsArgs = {
    pollId: pollId,
    maciContractAddress,
    approval,
    sessionKeyAddress,
    chain: CHAIN,
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/proof/submit`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
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
};
