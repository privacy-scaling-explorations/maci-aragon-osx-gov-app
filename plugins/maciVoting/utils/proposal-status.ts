import { type Proposal } from "@/plugins/maciVoting/utils/types";
import { type Tally } from "./types";
import { compactNumber } from "@/utils/numbers";
import { formatEther } from "viem";
export const RATIO_BASE = 1_000_000;

export function getProposalStatusVariant(proposal: Proposal) {
  // Terminal cases
  if (!proposal?.tally) return { variant: "info", label: "(Loading)" };
  else if (proposal.executed) return { variant: "primary", label: "Executed" };

  if (!proposal.active) {
    // Defeated or executable?
    const yesNoVotes = proposal.tally.no + proposal.tally.yes;
    if (!yesNoVotes) return { variant: "critical", label: "Defeated" };

    const totalVotes = proposal.tally.abstain + yesNoVotes;
    if (totalVotes < proposal.parameters.minVotingPower) {
      return { variant: "critical", label: "Low turnout" };
    }

    if (proposal.tally.yes > proposal.tally.no) {
      return { variant: "success", label: "Executable" };
    }
    return { variant: "critical", label: "Defeated" };
  }

  return { variant: "info", label: "Active" };
}

export function getWinningOption(tally: Tally | undefined): {
  option: string;
  voteAmount: string;
  votePercentage: number;
} {
  if (!tally) return { option: "Yes", voteAmount: "0", votePercentage: 0 };
  const totalVotes = tally.yes + tally.no + tally.abstain;

  if (totalVotes === BigInt(0)) return { option: "Yes", voteAmount: "0", votePercentage: 0 };
  const winningOption = tally.yes >= tally.no ? (tally.yes >= tally.abstain ? "Yes" : "Abstain") : "No";
  const winningVotes = tally.yes >= tally.no ? (tally.yes >= tally.abstain ? tally.yes : tally.abstain) : tally.no;

  return {
    option: winningOption,
    voteAmount: compactNumber(formatEther(winningVotes), 2),
    votePercentage: Number((winningVotes * 100n) / totalVotes),
  };
}
