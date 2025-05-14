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

export const ProofSchema = z.object({
  publicInputs: z.array(z.string()),
  proof: z.array(z.string()),
});

export const TallyDataSchema = z.object({
  results: z.array(z.string()),
  salt: z.string(),
  newTallyCommitment: z.string(),
});

export const GenerateDataSchema = z.object({
  processProofs: z.array(ProofSchema),
  tallyProofs: z.array(ProofSchema),
  tallyData: TallyDataSchema,
});

export const MergeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export const SubmitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  txHash: z.string().optional(),
});

export type ZProof = z.infer<typeof ProofSchema>;
export type ZTallyData = z.infer<typeof TallyDataSchema>;
export type ZGenerateData = z.infer<typeof GenerateDataSchema>;
export type ZMergeResponse = z.infer<typeof MergeResponseSchema>;
export type ZSubmitResponse = z.infer<typeof SubmitResponseSchema>;

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

export const merge = async (
  maciContractAddress: Address,
  pollId: number,
  approval: string,
  sessionKeyAddress: Address
) => {
  const response = await fetch(`${BASE_URL}/proof/merge`, {
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

  const data = await response.json();
  return MergeResponseSchema.parse(data);
};

export const generateProofs = async (
  pollId: number,
  maciContractAddress: Address,
  approval: string,
  sessionKeyAddress: Address
) => {
  const coordinatorMACIKeypair = new Keypair(
    PrivateKey.deserialize("macisk.bdd73f1757f75261a0c9997def6cd47519cad2856347cdc6fd30718999576860")
  );

  const blockNumber = await publicClient.getBlockNumber();
  const encryptedCoordinatorPrivateKey = await encryptWithCoordinatorRSAPublicKey(
    coordinatorMACIKeypair.privateKey.serialize()
  );

  const response = await fetch(`${BASE_URL}/proof/generate`, {
    method: "POST",
    headers: {
      Authorization: encryptedHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    } as IGenerateArgs),
  });
  // const body = (await response.json()) as IGenerateData;
  const rawData = await response.json();
  return GenerateDataSchema.parse(rawData);
};

export const submit = async (
  pollId: number,
  maciContractAddress: Address,
  approval: string,
  sessionKeyAddress: Address
) => {
  const response = await fetch(`${BASE_URL}/proof/submit`, {
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

  const data = await response.json();
  return SubmitResponseSchema.parse(data);
};
