import { EMode } from "@maci-protocol/sdk";
import { z } from "zod";

const TallyDataSchema = z.object({
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

const CircuitInputsSchema = z.record(
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

const ProofSchema = z.object({
  proof: Groth16ProofSchema.or(SnarkProofSchema),
  circuitInputs: CircuitInputsSchema,
  publicInputs: z.array(z.string()),
});

export const GenerateResponseSchema = z.object({
  processProofs: z.array(ProofSchema),
  tallyProofs: z.array(ProofSchema),
  tallyData: TallyDataSchema,
});

export const SubmitResponseSchema = TallyDataSchema;
