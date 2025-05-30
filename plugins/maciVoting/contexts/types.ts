import { type Keypair } from "@maci-protocol/domainobjs";
import { type IProof, type ITallyData } from "@maci-protocol/sdk/browser";
import { type VoteOption } from "../utils/types";

export interface IVoteArgs {
  voteOptionIndex: bigint;
  newVoteWeight: bigint;
}

export interface IGenerateData {
  processProofs: IProof[];
  tallyProofs: IProof[];
  tallyData: ITallyData;
}
export type TCoordinatorServiceResult<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export type FinalizeStatus = "notStarted" | "merging" | "proving" | "submitting" | "submitted";

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
  deleteKeypair: () => void;
  onSignup: () => Promise<void>;
  onJoinPoll: (pollId: bigint) => Promise<void>;
  onVote: (option: VoteOption) => Promise<void>;
}
