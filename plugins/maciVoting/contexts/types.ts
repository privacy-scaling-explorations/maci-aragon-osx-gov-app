import { type Keypair } from "@maci-protocol/domainobjs";
import { type downloadPollJoiningArtifactsBrowser, type IProof, type ITallyData } from "@maci-protocol/sdk/browser";

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

export interface IFinalizeProposalArgs {
  pollId: number;
  setFinalizeStatus: (status: FinalizeStatus) => void;
}

export interface ISchedulePollArgs {
  pollId: number;
  deploymentBlockNumber: number;
}

export interface ISchedulePollFinalizationData {
  isScheduled: boolean;
}

export interface IMaciContextType {
  isLoading: boolean;
  error?: string;
  isRegistered?: boolean;
  maciKeypair?: Keypair;
  stateIndex?: string;
  artifacts?: Awaited<ReturnType<typeof downloadPollJoiningArtifactsBrowser>>;
  deleteKeypair: () => void;
  onSignup: () => Promise<void>;
}

export interface IJoinPollData {
  /**
   * The poll state index of the joined user
   */
  pollStateIndex: string;
  /**
   * Voice credits balance
   */
  voiceCredits: string;
  /**
   * Private key nullifier
   */
  nullifier: string;
  /**
   * The join poll transaction hash
   */
  hash: string;
}
