import { type Keypair } from "@maci-protocol/domainobjs";
import { type z } from "zod";
import { type VoteOption } from "../utils/types";
import { type GenerateResponseSchema, type SubmitResponseSchema } from "./schemas";

export interface IVoteArgs {
  voteOptionIndex: bigint;
  newVoteWeight: bigint;
}

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;
export type CoordinatorServiceResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export interface CoordinatorContextType {
  merge: (pollId: number) => Promise<CoordinatorServiceResult<boolean>>;
  generateProofs: (
    pollId: number,
    encryptedCoordinatorPrivateKey: string
  ) => Promise<CoordinatorServiceResult<GenerateResponse>>;
  submit: (pollId: number) => Promise<CoordinatorServiceResult<SubmitResponse>>;
}

export interface MaciContextType {
  isLoading: boolean;
  error?: string;
  pollId?: bigint;
  setPollId: (pollId: bigint) => void;
  hasJoinedPoll: boolean;
  initialVoiceCredits: number;
  pollStateIndex?: string;
  isRegistered?: boolean;
  maciKeypair?: Keypair;
  stateIndex?: string;
  createKeypair: () => Promise<Keypair>;
  onSignup: () => Promise<void>;
  onJoinPoll: (pollId: bigint) => Promise<void>;
  onVote: (option: VoteOption) => Promise<void>;
}
