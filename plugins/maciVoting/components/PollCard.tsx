import { Button, Card, Heading } from "@aragon/ods";
import { useCallback, useEffect, useState } from "react";
import { useMaci } from "../hooks/useMaci";
import { VoteOption } from "../utils/types";

const PollCard = ({ pollId }: { pollId: bigint }) => {
  // check if the user joined the poll
  const { setPollId, onJoinPoll, onVote, isRegistered, hasJoinedPoll, error: maciError } = useMaci();
  const [error, setError] = useState<string | undefined>(maciError);

  useEffect(() => {
    setPollId(pollId);
  }, [pollId, setPollId]);

  const onClickJoinPoll = useCallback(async () => {
    setError(undefined);
    if (!isRegistered) {
      setError("You need to sign up first");
      return;
    }

    if (hasJoinedPoll) {
      setError("You have already joined the poll");
      return;
    }

    await onJoinPoll(pollId);
  }, [hasJoinedPoll, isRegistered, onJoinPoll, pollId]);

  const onClickVote = useCallback(
    async (option: VoteOption) => {
      await onVote(option);
    },
    [onVote]
  );

  return (
    <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
      <Heading size="h3">MACI Poll</Heading>
      <div className="flex flex-col justify-between">
        <p className="text-sm text-critical-500">{error}</p>
      </div>
      {isRegistered ? (
        <>
          {hasJoinedPoll ? (
            <div className="flex flex-col justify-between gap-y-2">
              <p>Submit your vote anonymously to the poll. Results will be tallied after the voting period ends.</p>
              <div className="flex flex-row gap-x-1">
                <Button onClick={() => onClickVote(VoteOption.Yes)}>Yes</Button>
                <Button onClick={() => onClickVote(VoteOption.No)}>No</Button>
                <Button onClick={() => onClickVote(VoteOption.Abstain)}>Abstain</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between gap-y-2">
              <p>
                In order to submit your vote you need to join the poll using your locally generated MACI public key and
                any wallet you want.
              </p>
              <Button onClick={onClickJoinPoll}>Join poll</Button>
            </div>
          )}
        </>
      ) : (
        <p>Go back to MACI Voting to generate your MACI keys and register them in the main contract</p>
      )}
    </Card>
  );
};

export default PollCard;
