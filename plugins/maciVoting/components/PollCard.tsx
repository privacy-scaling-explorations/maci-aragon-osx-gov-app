import { PleaseWaitSpinner } from "@/components/please-wait";
import { Button, Card, Heading } from "@aragon/ods";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useJoinPoll } from "../hooks/poll/useJoinPoll";
import { useVote } from "../hooks/poll/useVote";
import { useGetPollData } from "../hooks/useGetPollData";
import { useMaci } from "../hooks/useMaci";
import { unixTimestampToDate } from "../utils/formatPollDate";
import { VoteOption } from "../utils/types";
import { VoteResultCard } from "./VoteResultCard";

const PollCard = ({ pollId }: { pollId: bigint }) => {
  // check if the user joined the poll
  const { isRegistered, error: maciError } = useMaci();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [voteOption, setVoteOption] = useState<VoteOption | undefined>(undefined);

  const { data: { voteStartDate, tallied, voteEnded, disabled, results } = {} } = useGetPollData(pollId);
  const { joinPollFunction, hasJoinedPoll, joinedPollData, isLoading: isLoadingJoinedPoll } = useJoinPoll(pollId);
  const { voteFunction } = useVote();

  useEffect(() => {
    setError(maciError);
  }, [maciError]);

  const onClickJoinPoll = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    if (!isRegistered) {
      setError("You need to sign up first");
      setIsLoading(false);
      return;
    }

    if (hasJoinedPoll) {
      setError("You have already joined the poll");
      setIsLoading(false);
      return;
    }

    await joinPollFunction();
    setIsLoading(false);
  }, [hasJoinedPoll, isRegistered, joinPollFunction]);

  const onClickVote = useCallback(
    async (option: VoteOption) => {
      setIsLoading(true);
      if (!joinedPollData) {
        setError("You need to join the poll first");
        setIsLoading(false);
        return;
      }

      const { pollStateIndex, voiceCredits } = joinedPollData;

      setVoteOption(option);
      await voteFunction(pollId, pollStateIndex, voiceCredits, option)
        .catch((error) => {
          setError(error.message);
        })
        .finally(() => {
          setVoteOption(undefined);
          setIsLoading(false);
        });
    },
    [joinedPollData, pollId, voteFunction]
  );

  const buttonMessage = useMemo(() => {
    if (isLoadingJoinedPoll) {
      return <PleaseWaitSpinner fullMessage="Checking user status..." />;
    }
    if (hasJoinedPoll) {
      return "Already joined poll";
    }
    if (isLoading) {
      return <PleaseWaitSpinner fullMessage="Joining poll..." />;
    }
    return "Join poll";
  }, [isLoadingJoinedPoll, hasJoinedPoll, isLoading]);

  if (voteEnded && !tallied)
    return (
      <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
        <Heading size="h3">MACI Poll</Heading>
        <div className="flex flex-col justify-between">
          <p className="text-sm text-critical-500">{error}</p>
        </div>
        <p>The voting period has ended and you can no longer vote. Please wait for the results to be tallied.</p>
      </Card>
    );

  if (voteEnded && tallied && !results)
    return (
      <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
        <Heading size="h3">MACI Poll</Heading>
        <div className="flex flex-col justify-between">
          <p className="text-sm text-critical-500">{error}</p>
        </div>
        <p>The results have been tallied. Results will be displayed here soon.</p>
      </Card>
    );

  if (voteEnded && tallied && results) {
    return (
      <div className="flex flex-col gap-10">
        <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
          <Heading size="h3">Results</Heading>
          {error && (
            <div className="flex flex-col justify-between">
              <p className="text-sm text-critical-500">{error}</p>
            </div>
          )}
          <p>The voting period has ended. Here are the results:</p>
          <VoteResultCard results={results} />
        </Card>
      </div>
    );
  }

  if (!isRegistered)
    return (
      <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
        <Heading size="h3">MACI Poll</Heading>
        <div className="flex flex-col justify-between">
          <p className="text-sm text-critical-500">{error}</p>
        </div>
        <p>Go back to MACI Voting to generate your MACI keys and register them in the main contract</p>
      </Card>
    );

  if (isRegistered && !hasJoinedPoll)
    return (
      <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
        <Heading size="h3">MACI Poll</Heading>
        <div className="flex flex-col justify-between">
          <p className="text-sm text-critical-500">{error}</p>
        </div>
        <div className="flex flex-col justify-between gap-y-2">
          <p>
            In order to submit your vote you need to join the poll using your locally generated MACI public key and your
            authorized wallet.
          </p>
          <Button onClick={onClickJoinPoll} disabled={hasJoinedPoll || isLoading || isLoadingJoinedPoll}>
            {buttonMessage}
          </Button>
        </div>
      </Card>
    );

  if (isRegistered && hasJoinedPoll)
    return (
      <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
        <Heading size="h3">MACI Poll</Heading>
        <div className="flex flex-col justify-between">
          <p className="text-sm text-critical-500">{error}</p>
        </div>
        <div className="flex flex-col justify-between gap-y-2">
          <p>
            Submit your vote anonymously to the poll using any wallet. Results will be tallied after the voting period
            ends.
          </p>
          {voteStartDate &&
            voteStartDate > Math.round(Date.now() / 1000) &&
            `The vote will start on ${unixTimestampToDate(voteStartDate)}`}
          <div className="flex flex-row gap-x-1">
            <Button
              onClick={() => onClickVote(VoteOption.Yes)}
              disabled={disabled ? disabled : isLoading}
              size="sm"
              variant={disabled ? "tertiary" : "success"}
            >
              {isLoading && voteOption === VoteOption.Yes ? <PleaseWaitSpinner fullMessage="Yes" /> : "Yes"}
            </Button>
            <Button
              onClick={() => onClickVote(VoteOption.No)}
              disabled={disabled ? disabled : isLoading}
              size="sm"
              variant={disabled ? "tertiary" : "critical"}
            >
              {isLoading && voteOption === VoteOption.No ? <PleaseWaitSpinner fullMessage="No" /> : "No"}
            </Button>
            <Button
              onClick={() => onClickVote(VoteOption.Abstain)}
              disabled={disabled ? disabled : isLoading}
              size="sm"
              variant={disabled ? "tertiary" : "warning"}
            >
              {isLoading && voteOption === VoteOption.Abstain ? <PleaseWaitSpinner fullMessage="Abstain" /> : "Abstain"}
            </Button>
          </div>
        </div>
      </Card>
    );
};

export default PollCard;
