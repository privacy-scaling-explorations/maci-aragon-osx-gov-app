import { Button } from "@aragon/ods";
import { VoteOption } from "../utils/types";
import { useMaci } from "../hooks/useMaci";
import { useCallback, useMemo } from "react";

const VoteOptions = ({ voteEnded, voteStartDate }: { voteEnded: boolean; voteStartDate: number }) => {
  const { onVote, isLoading } = useMaci();

  const disabled = useMemo(() => {
    return isLoading || voteEnded || voteStartDate > Math.round(Date.now() / 1000);
  }, [isLoading, voteEnded, voteStartDate]);

  const onClickVote = useCallback(
    async (option: VoteOption) => {
      await onVote(option);
    },
    [onVote]
  );

  return (
    <div className="flex flex-row gap-x-1">
      <Button
        onClick={() => onClickVote(VoteOption.Yes)}
        disabled={disabled}
        size="sm"
        variant={disabled ? "tertiary" : "success"}
      >
        Yes
      </Button>
      <Button
        onClick={() => onClickVote(VoteOption.No)}
        disabled={disabled}
        size="sm"
        variant={disabled ? "tertiary" : "critical"}
      >
        No
      </Button>
      <Button
        onClick={() => onClickVote(VoteOption.Abstain)}
        disabled={disabled}
        size="sm"
        variant={disabled ? "tertiary" : "warning"}
      >
        Abstain
      </Button>
    </div>
  );
};

export default VoteOptions;
