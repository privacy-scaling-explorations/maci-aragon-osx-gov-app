import { type EPolicies, type EInitialVoiceCreditProxies, type EMode } from "@maci-protocol/sdk";

import type { Hex } from "viem";
import { type ESupportedNetworks } from "./networks";

/**
 * IConstantInitialVoiceCreditProxyArgs represents the arguments for deploying a constant initial voice credit proxy
 */
export interface IConstantInitialVoiceCreditProxyArgs {
  /**
   * The amount of initial voice credits to deploy
   */
  amount: number;
}

/**
 * IEASPolicyArgs represents the arguments for deploying an EAS policy
 */
export interface IEASPolicyArgs {
  /**
   * The address of the EAS contract
   */
  easAddress: string;

  /**
   * The attestation schema to be used
   */
  schema: string;

  /**
   * The trusted attester
   */
  attester: string;
}

/**
 * IZupassPolicyArgs represents the arguments for deploying a Zupass policy
 */
export interface IZupassPolicyArgs {
  /**
   * The first signer
   */
  signer1: string;

  /**
   * The second signer
   */
  signer2: string;

  /**
   * The event ID
   */
  eventId: string;

  /**
   * The Zupass verifier address
   */
  zupassVerifier: string;
}

/**
 * IHatsPolicyArgs represents the arguments for deploying a Hats policy
 */
export interface IHatsPolicyArgs {
  /**
   * The hats protocol address
   */
  hatsProtocolAddress: string;

  /**
   * The criterion hats
   */
  critrionHats: string[];
}

/**
 * ISemaphorePolicyArgs represents the arguments for deploying a semaphore policy
 */
export interface ISemaphorePolicyArgs {
  /**
   * The semaphore contract address
   */
  semaphoreContract: string;

  /**
   * The group ID
   */
  groupId: string;
}

/**
 * IMerkleProofPolicyArgs represents the arguments for deploying a merkle proof policy
 */
export interface IMerkleProofPolicyArgs {
  /**
   * The merkle proof root
   */
  root: string;
}

/**
 * ITokenPolicyArgs represents the arguments for deploying a sign up policy
 */
export interface ITokenPolicyArgs {
  /**
   * The token address
   */
  token: string;
}

/**
 * IAnonAadhaarPolicyArgs represents the arguments for deploying an Anon Aadhaar policy
 */
export interface IAnonAadhaarPolicyArgs {
  /**
   * The Anon Aadhaar verifier address
   */
  verifier: string;

  /**
   * The nullifier seed
   */
  nullifierSeed: string;
}

/**
 * IGitcoinPassportPolicyArgs represents the arguments for deploying a gitcoin passport policy
 */
export interface IGitcoinPassportPolicyArgs {
  /**
   * The decoder address
   */
  decoderAddress: string;

  /**
   * The passing score
   */
  passingScore: string;
}

/**
 * IERC20VotesPolicyArgs represents the arguments for deploying an ERC20 votes policy
 */
export interface IERC20VotesPolicyArgs {
  /**
   * The token address
   */
  token: string;

  /**
   * The threshold
   */
  threshold: bigint | string;

  /**
   * The snapshot block
   */
  snapshotBlock: bigint | string;
}

/**
 * IERC20PolicyArgs represents the arguments for deploying an ERC20 policy
 */
export interface IERC20PolicyArgs {
  /**
   * The token address
   */
  token: string;

  /**
   * The threshold
   */
  threshold: string;
}

/**
 * IPolicyArgs represents the arguments for deploying a policy
 */
export type IPolicyArgs =
  | IEASPolicyArgs
  | IZupassPolicyArgs
  | IHatsPolicyArgs
  | ISemaphorePolicyArgs
  | IMerkleProofPolicyArgs
  | ITokenPolicyArgs
  | IAnonAadhaarPolicyArgs
  | IGitcoinPassportPolicyArgs
  | IERC20VotesPolicyArgs
  | IERC20PolicyArgs;

export type IInitialVoiceCreditProxyArgs = IConstantInitialVoiceCreditProxyArgs;

/**
 * DeployPollConfig is the configuration for deploying a poll
 */
export interface IDeployPollConfig {
  /**
   * The poll's start date
   */
  startDate: number;

  /**
   * The poll's end date
   */
  endDate: number;

  /**
   * The coordinator publicKey
   */
  coordinatorPublicKey: string;

  /**
   * Voting mode
   */
  mode: EMode;

  /**
   * Determines the tally batch size
   */
  tallyProcessingStateTreeDepth: number;

  /**
   * Message batch size
   */
  messageBatchSize: number;

  /**
   * Poll state tree depth
   */
  pollStateTreeDepth: number;

  /**
   * Vote option tree depth
   */
  voteOptionTreeDepth: number;

  /**
   * The policy configuration
   */
  policy: {
    type: EPolicies;
    args?: IPolicyArgs;
    address?: Hex;
  };

  /**
   * The initial voice credits proxy configuration
   */
  initialVoiceCreditsProxy: {
    type: EInitialVoiceCreditProxies;
    args: IInitialVoiceCreditProxyArgs;
    address?: Hex;
  };

  /**
   * The relayer addresses
   */
  relayers?: string[];

  /**
   * Number of valid vote options
   */
  voteOptions: bigint | string;
}

/**
 * Interface that represents generate proofs arguments
 */
export interface IGenerateArgs {
  /**
   * Approval for the session key
   */
  approval?: string;

  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;

  /**
   * Chain
   */
  chain: ESupportedNetworks;

  /**
   * Poll id
   */
  poll: number;

  /**
   * Maci contract address
   */
  maciContractAddress: string;

  /**
   * Whether to use Qv or NonQv
   */
  mode: EMode;

  /**
   * Encrypted coordinator private key with RSA public key (see .env.example)
   */
  encryptedCoordinatorPrivateKey: string;

  /**
   * Start block for event processing
   */
  startBlock?: number;

  /**
   * End block for event processing
   */
  endBlock?: number;

  /**
   * Blocks per batch for event processing
   */
  blocksPerBatch?: number;
}

/**
 * Submit proofs on-chain arguments
 */
export interface ISubmitProofsArgs {
  /**
   * MACI contract address
   */
  maciContractAddress: string;

  /**
   * Poll ID
   */
  pollId: number;

  /**
   * Approval for the session key
   */
  approval?: string;

  /**
   * Session key address
   */
  sessionKeyAddress?: Hex;

  /**
   * Chain
   */
  chain: ESupportedNetworks;
}
