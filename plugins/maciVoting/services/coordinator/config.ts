import { EPolicies, EMode, EInitialVoiceCreditProxies } from "@maci-protocol/sdk";
import { coordinatorMACIKeypair } from "./coordinator";
import { type IDeployPollConfig } from "./utils/types";

const MSG_BATCH_SIZE = 20;

const startDate = Math.floor(Date.now() / 1000) + 100;
const pollDuration = 60; // TODO:

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
    type: EPolicies.FreeForAll, // TODO:
  },
  initialVoiceCreditsProxy: {
    type: EInitialVoiceCreditProxies.Constant, // TODO:
    args: {
      amount: 100,
    },
  },
  voteOptions: 2n,
};
