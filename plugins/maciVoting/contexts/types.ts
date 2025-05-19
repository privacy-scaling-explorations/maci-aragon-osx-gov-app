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
export interface ICoordinatorServiceResult<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface CoordinatorContextType {
  merge: (pollId: number) => Promise<ICoordinatorServiceResult<boolean>>;
  generateProofs: ({
    pollId,
    encryptedCoordinatorPrivateKey,
    startBlock,
    endBlock,
  }: {
    pollId: number;
    encryptedCoordinatorPrivateKey: string;
    startBlock: number;
    endBlock: number;
  }) => Promise<ICoordinatorServiceResult<GenerateResponse>>;
  submit: (pollId: number) => Promise<ICoordinatorServiceResult<SubmitResponse>>;
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
  createKeypair: () => Promise<Keypair | undefined>;
  onSignup: () => Promise<void>;
  onJoinPoll: (pollId: bigint) => Promise<void>;
  onVote: (option: VoteOption) => Promise<void>;
}
