import { PUBLIC_CHAIN_NAME, PUBLIC_COORDINATOR_SERVICE_URL, PUBLIC_MACI_ADDRESS } from "@/constants";
import { useCallback } from "react";
import { toBackendChainFormat } from "../utils/chains";

interface ISchedulePollArgs {
  proposalId?: string;
  deploymentBlockNumber?: number;
}

interface ICoordinatorSchedulePollType {
  schedulePoll: (args: ISchedulePollArgs) => Promise<void>;
}

export const useCoordinatorSchedulePoll = () => {
  const schedulePoll = useCallback(async ({ proposalId, deploymentBlockNumber }: ISchedulePollArgs) => {
    if (!proposalId) {
      throw new Error("Proposal ID is required to schedule a poll.");
    }

    const response = await fetch(`${PUBLIC_COORDINATOR_SERVICE_URL}/poll/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maciContractAddress: PUBLIC_MACI_ADDRESS,
        proposalId,
        deploymentBlockNumber,
        chain: toBackendChainFormat(PUBLIC_CHAIN_NAME),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to schedule poll: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  }, []);

  return {
    schedulePoll,
  } as ICoordinatorSchedulePollType;
};
