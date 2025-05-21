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
export type ICoordinatorServiceResult<T, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

export interface IGenerateProofsArgs {
  pollId: number;
  startBlock: number;
  endBlock: number;
}

export type FinalizeStatus = "notStarted" | "merging" | "merged" | "proving" | "proved" | "submitting" | "submitted";

export interface ICoordinatorContextType {
  finalizeStatus: FinalizeStatus;
  finalizeProposal: (pollId: number) => Promise<void>;
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
