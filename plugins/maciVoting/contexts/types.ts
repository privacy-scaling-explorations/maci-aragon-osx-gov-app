import { type Keypair } from "@maci-protocol/domainobjs";

export interface IVoteArgs {
  voteOptionIndex: bigint;
  newVoteWeight: bigint;
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
  onVote?: (
    args: IVoteArgs[],
    pollId: string,
    onError: (err: string) => void | Promise<void>,
    onSuccess: () => void | Promise<void>
  ) => Promise<void>;
}
