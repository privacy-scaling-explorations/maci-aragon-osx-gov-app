import { Button, Card, Heading } from "@aragon/ods";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMaci } from "../hooks/useMaci";
import { VoteOption } from "../utils/types";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { getPoll } from "@maci-protocol/sdk/browser";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { unixTimestampToDate } from "../utils/formatPollDate";

const PollCard = ({ pollId }: { pollId: bigint }) => {
  // check if the user joined the poll
  const { setPollId, onJoinPoll, onVote, isRegistered, hasJoinedPoll, isLoading, error: maciError } = useMaci();
  const signer = useEthersSigner();
  const [error, setError] = useState<string | undefined>(undefined);
  const [voteStartDate, setVoteStartDate] = useState(0);
  const [voteEnded, setVoteEnded] = useState(false);
  const [voteOption, setVoteOption] = useState<VoteOption | undefined>(undefined);

  const disabled = useMemo(() => {
    return isLoading || voteEnded || voteStartDate > Math.round(Date.now() / 1000);
  }, [isLoading, voteEnded, voteStartDate]);

  useEffect(() => {
    setError(maciError);
  }, [maciError]);

  useEffect(() => {
    if (!signer) {
      return;
    }

    const checkVoteEnded = async () => {
      const poll = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      const endDate = Number(poll.endDate);
      const startDate = Number(poll.startDate);
      const now = Math.round(Date.now() / 1000);
      setVoteStartDate(startDate);
      setVoteEnded(endDate < now);
    };

    checkVoteEnded();
  }, [voteEnded, setVoteEnded, pollId, signer]);

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
      setVoteOption(option);
      await onVote(option).finally(() => setVoteOption(undefined));
    },
    [onVote]
  );

  const buttonMessage = useMemo(() => {
    if (hasJoinedPoll) {
      return "Already joined poll";
    }
    if (isLoading) {
      return <PleaseWaitSpinner fullMessage="Joining poll..." />;
    }
    return "Join poll";
  }, [hasJoinedPoll, isLoading]);

  if (voteEnded)
    return (
      <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
        <Heading size="h3">MACI Poll</Heading>
        <div className="flex flex-col justify-between">
          <p className="text-sm text-critical-500">{error}</p>
        </div>
        <p>The voting period has ended. You can no longer vote.</p>
      </Card>
    );

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
          <Button onClick={onClickJoinPoll} disabled={hasJoinedPoll || isLoading}>
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
          {voteStartDate > Math.round(Date.now() / 1000) &&
            `The vote will start on ${unixTimestampToDate(voteStartDate)}`}
          <div className="flex flex-row gap-x-1">
            <Button
              onClick={() => onClickVote(VoteOption.Yes)}
              disabled={disabled}
              size="sm"
              variant={disabled ? "tertiary" : "success"}
            >
              {isLoading && voteOption === VoteOption.Yes ? <PleaseWaitSpinner fullMessage="Yes" /> : "Yes"}
            </Button>
            <Button
              onClick={() => onClickVote(VoteOption.No)}
              disabled={disabled}
              size="sm"
              variant={disabled ? "tertiary" : "critical"}
            >
              {isLoading && voteOption === VoteOption.No ? <PleaseWaitSpinner fullMessage="No" /> : "No"}
            </Button>
            <Button
              onClick={() => onClickVote(VoteOption.Abstain)}
              disabled={disabled}
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
