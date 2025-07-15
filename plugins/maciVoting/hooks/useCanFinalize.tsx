import { useState, useEffect } from "react";
import { useGetPollData } from "./useGetPollData";

export const useCanFinalize = (pollId?: bigint) => {
  const [canFinalize, setCanFinalize] = useState(false);

  const { data: { voteEnded, tallied } = {} } = useGetPollData(pollId);

  useEffect(() => {
    setCanFinalize(!!voteEnded && !tallied);
  }, [voteEnded, tallied]);

  return canFinalize;
};
