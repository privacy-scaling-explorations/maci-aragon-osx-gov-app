import { type Keypair } from "@maci-protocol/domainobjs";

export interface IVoteArgs {
  voteOptionIndex: bigint;
  newVoteWeight: bigint;
}

export interface MaciContextType {
  isLoading: boolean;
  error?: string;
  initialVoiceCredits: number;
  isRegistered?: boolean;
  maciKeypair?: Keypair;
  //isEligibleToVote: boolean;
  stateIndex?: string;
  createKeypair: () => Promise<Keypair>;
  onSignup: () => Promise<void>;
  onJoinPoll?: (pollId: bigint) => Promise<void>;
  onVote?: (
    args: IVoteArgs[],
    pollId: string,
    onError: (err: string) => void | Promise<void>,
    onSuccess: () => void | Promise<void>
  ) => Promise<void>;
}
