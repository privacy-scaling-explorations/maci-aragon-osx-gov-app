import { EPolicies, EMode, EInitialVoiceCreditProxies } from "@maci-protocol/sdk";
import { type IDeployPollConfig } from "./utils/types";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";

const MSG_BATCH_SIZE = 20;

const startDate = Math.floor(Date.now() / 1000) + 100;
const pollDuration = 60;

// TODO: what should I do with this?
const coordinatorMACIKeypair = new Keypair(
  PrivateKey.deserialize("macisk.bdd73f1757f75261a0c9997def6cd47519cad2856347cdc6fd30718999576860")
);

export const pollDeploymentConfig: IDeployPollConfig = {
  startDate,
  endDate: startDate + pollDuration,
  mode: EMode.NON_QV,
  coordinatorPublicKey: coordinatorMACIKeypair.publicKey.serialize(),
  tallyProcessingStateTreeDepth: 1,
  messageBatchSize: MSG_BATCH_SIZE,
  pollStateTreeDepth: 10,
  voteOptionTreeDepth: 2,
  policy: {
    type: EPolicies.ERC20Votes,
  },
  initialVoiceCreditsProxy: {
    type: EInitialVoiceCreditProxies.ERC20Votes,
    args: {
      amount: 100,
    },
  },
  voteOptions: 2n,
};
