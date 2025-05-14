import { EPolicies, EMode, EInitialVoiceCreditProxies } from "@maci-protocol/sdk";
import { startDate, pollDuration, coordinatorMACIKeypair } from "./coordinator";
import { type IDeployPollConfig } from "./utils/types";

const MSG_BATCH_SIZE = 20;

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
    type: EPolicies.FreeForAll,
  },
  initialVoiceCreditsProxy: {
    type: EInitialVoiceCreditProxies.Constant,
    args: {
      amount: 100,
    },
  },
  voteOptions: 2n,
};
