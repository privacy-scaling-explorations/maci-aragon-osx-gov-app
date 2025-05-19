import { type Keypair } from "@maci-protocol/domainobjs";
import { type z } from "zod";
import { type VoteOption } from "../utils/types";
import { type GenerateResponseSchema, type SubmitResponseSchema } from "./schemas";

export interface IVoteArgs {
  voteOptionIndex: bigint;
  newVoteWeight: bigint;
}

export type TGenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type TSubmitResponse = z.infer<typeof SubmitResponseSchema>;
export interface ICoordinatorServiceResult<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface IGenerateProofsArgs {
  pollId: number;
  encryptedCoordinatorPrivateKey: string;
  startBlock: number;
  endBlock: number;
}

export interface ICoordinatorContextType {
  merge: (pollId: number) => Promise<ICoordinatorServiceResult<boolean>>;
  generateProofs: (args: IGenerateProofsArgs) => Promise<ICoordinatorServiceResult<TGenerateResponse>>;
  submit: (pollId: number) => Promise<ICoordinatorServiceResult<TSubmitResponse>>;
}

export interface IMaciContextType {
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
