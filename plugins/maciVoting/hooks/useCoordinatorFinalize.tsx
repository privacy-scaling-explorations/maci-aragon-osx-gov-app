import { useCallback, useState } from "react";
import { type FinalizeStatus } from "../contexts/types";
import { useCoordinator } from "./useCoordinator";
import { useGetPollData } from "./useGetPollData";

interface ICoordinatorFinalizeType {
  finalizeStatus: FinalizeStatus;
  finalizeProposal: () => Promise<void>;
}

export const useCoordinatorFinalize = (pollId?: number): ICoordinatorFinalizeType => {
  const [finalizeStatus, setFinalizeStatus] = useState<FinalizeStatus>("notStarted");
  const { refetch } = useGetPollData(String(pollId));
  const { finalizeProposal: finalizePoll } = useCoordinator();

  const finalizeProposal = useCallback(async () => {
    if (!pollId) {
      return;
    }

    await finalizePoll({ pollId, setFinalizeStatus });

    await refetch();

    setTimeout(async () => {
      await refetch();
    }, 13000); // 13s delay for refetching data
  }, [finalizePoll, pollId, refetch]);

  return {
    finalizeStatus,
    finalizeProposal,
  };
};
