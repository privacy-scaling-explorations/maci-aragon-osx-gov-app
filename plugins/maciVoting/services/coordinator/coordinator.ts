import { type Address } from "viem";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { z } from "zod";
import { ESupportedNetworks } from "./utils/networks";
import { type IGenerateArgs, type ISubmitProofsArgs } from "./utils/types";
import { getAuthorizationHeader, encryptWithCoordinatorRSAPublicKey } from "./utils/auth";
import { getSigner, getPublicClient } from "./utils/chain";
import { pollDeploymentConfig } from "./config";

const BASE_URL = "http://localhost:3000/v1";
const CHAIN = ESupportedNetworks.OPTIMISM_SEPOLIA;

export enum EMode {
  QV,
  NON_QV,
  FULL,
}

export const TallyDataSchema = z.object({
  maci: z.string(),
  pollId: z.string(),
  network: z.string().optional(),
  chainId: z.string().optional(),
  mode: z.nativeEnum(EMode),
  tallyAddress: z.string(),
  newTallyCommitment: z.string(),
  results: z.object({
    tally: z.array(z.string()),
    salt: z.string(),
    commitment: z.string(),
  }),
  totalSpentVoiceCredits: z.object({
    spent: z.string(),
    salt: z.string(),
    commitment: z.string(),
  }),
  perVoteOptionSpentVoiceCredits: z
    .object({
      tally: z.array(z.string()),
      salt: z.string(),
      commitment: z.string(),
    })
    .optional(),
});

export const CircuitInputsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.bigint(),
    z.array(z.bigint()),
    z.array(z.array(z.bigint())),
    z.array(z.string()),
    z.array(z.array(z.array(z.bigint()))),
  ])
);

const Groth16ProofSchema = z.object({
  pi_a: z.array(z.string()),
  pi_b: z.array(z.array(z.string())),
  pi_c: z.array(z.string()),
  protocol: z.string(),
  curve: z.string(),
});

const SnarkProofSchema = z.object({
  pi_a: z.array(z.bigint()),
  pi_b: z.array(z.array(z.bigint())),
  pi_c: z.array(z.bigint()),
});

export const ProofSchema = z.object({
  proof: Groth16ProofSchema.or(SnarkProofSchema),
  circuitInputs: CircuitInputsSchema,
  publicInputs: z.array(z.string()),
});

export const GenerateDataSchema = z.object({
  processProofs: z.array(ProofSchema),
  tallyProofs: z.array(ProofSchema),
  tallyData: TallyDataSchema,
});

export const SubmitResponseSchema = TallyDataSchema;

export type GenerateData = z.infer<typeof GenerateDataSchema>;
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;

/**
 * Start date for the poll (it cannot be in the past)
 * n seconds are added to give it time until it is deployed
 */
export const startDate = Math.floor(Date.now() / 1000) + 100;

/**
 * Poll duration in seconds
 * n seconds are added to the poll start date
 */
export const pollDuration = 60;

/**
 * Coordinator MACI Keypair
 */
export const coordinatorMACIKeypair = new Keypair(
  PrivateKey.deserialize("macisk.bdd73f1757f75261a0c9997def6cd47519cad2856347cdc6fd30718999576860")
);

const signer = getSigner(CHAIN);
const encryptedHeader = await getAuthorizationHeader(signer);
const publicClient = getPublicClient(CHAIN);

type CoordinatorServiceResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

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
): Promise<CoordinatorServiceResult<GenerateData>> => {
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
    data: GenerateDataSchema.parse(data),
  };
};

export const submit = async (
  pollId: number,
  maciContractAddress: Address,
  approval: string,
  sessionKeyAddress: Address
): Promise<CoordinatorServiceResult<SubmitResponse>> => {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/proof/submit`, {
      method: "POST",
      headers: {
        Authorization: encryptedHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pollId: pollId,
        maciContractAddress,
        approval,
        sessionKeyAddress,
        chain: CHAIN,
      } as ISubmitProofsArgs),
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
