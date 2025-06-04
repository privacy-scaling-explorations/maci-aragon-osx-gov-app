import { useProposal } from "@/plugins/maciVoting/hooks/useProposal";
import ProposalHeader from "@/plugins/maciVoting/components/proposal/header";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { useProposalExecute } from "@/plugins/maciVoting/hooks/useProposalExecute";
import { BodySection } from "@/components/proposal/proposalBodySection";
import { ProposalAction } from "@/components/proposalAction/proposalAction";
import { CardResources } from "@/components/proposal/cardResources";
import { If } from "@/components/if";
import PollCard from "../components/PollCard";
import { FinalizeAction } from "../components/finalize/finalizeAction";
import { useCoordinator } from "../hooks/useCoordinator";
import { useCanFinalize } from "../hooks/useCanFinalize";
import { useEffect } from "react";
import { getPollContracts } from "@maci-protocol/sdk/browser";
import { PUBLIC_MACI_ADDRESS, PUBLIC_MACI_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";
import { usePublicClient } from "wagmi";

export default function ProposalDetail({ id: proposalId }: { id: string }) {
  const { proposal, status } = useProposal(proposalId, true);
  const showProposalLoading = getShowProposalLoading(proposal, status);
  const hasAction = proposal?.actions?.length ?? 0 > 0;

  const { finalizeStatus, checkIsTallied } = useCoordinator();
  const canFinalize = useCanFinalize(proposal?.pollId);
  const signer = useEthersSigner();
  const publicClient = usePublicClient();

  const { executeProposal, canExecute, isConfirming: isConfirmingExecution } = useProposalExecute(proposalId);

  useEffect(() => {
    const checkCanExecute = async () => {
      console.log("proposalId", proposalId);
      if (!proposalId) {
        console.log("No proposalId");
        return false;
      }
      console.log("proposal?.pollId", proposal?.pollId);
      if (!proposal?.pollId) {
        console.log("No proposal.pollId");
        return false;
      }

      if (proposal.executed) {
        console.log("Proposal already executed");
        return false;
      }

      // Verify that the proposal poll has ended.
      const isTallied = await checkIsTallied(Number(proposal.pollId));
      console.log("useEffect isTallied", isTallied);
      if (!isTallied) {
        console.log("Poll not tallied");
        return false;
      }
      if (!signer) {
        // eslint-disable-next-line no-console
        console.log("No signer");
        return false;
      }

      const pollContracts = await getPollContracts({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId: Number(proposal.pollId),
        signer,
      });
      const totalSpent = await pollContracts.tally.totalSpent();

      // // Check if the minimum participation threshold has been reached based on final voting results.
      // if (proposal?.parameters.minVotingPower && proposal.parameters.minVotingPower < totalSpent) {
      const minVP = BigInt(proposal?.parameters.minVotingPower ?? 0n); // always defined
      console.log("minVP", minVP);
      console.log("totalSpent", totalSpent);
      if (minVP < totalSpent) {
        // run the test even when minVP == 0
        console.log("Minimum participation threshold not reached");
        return false;
      }

      const results1 = await pollContracts.tally.tallyResults(0);
      const results2 = await pollContracts.tally.tallyResults(1);

      if (!results1[1] || !results2[1]) {
        console.log("no results");
        return false;
      }

      if (results2[0] < results1[0]) {
        console.log("no support");

        return false;
      }

      console.log("useEffect Can execute");

      if (!publicClient) {
        console.log("no publicClient");
        return false;
      }

      const canExecute = await publicClient.readContract({
        address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
        abi: MaciVotingAbi,
        functionName: "canExecute",
        args: [BigInt(proposalId)],
      });
      console.log("useEffect WAGMI read contract Can execute", canExecute);
    };
    checkCanExecute();
  }, [signer, proposal]);

  if (!proposal || showProposalLoading) {
    return (
      <section className="justify-left items-left flex w-screen min-w-full max-w-full">
        <PleaseWaitSpinner />
      </section>
    );
  }

  return (
    <section className="flex w-screen min-w-full max-w-full flex-col items-center">
      <ProposalHeader
        proposalNumber={Number(proposalId)}
        proposal={proposal}
        canExecute={canExecute}
        onExecutePressed={() => executeProposal()}
      />

      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-16 md:pb-20 md:pt-10">
        <div className="flex w-full flex-col gap-x-12 gap-y-6 md:flex-row">
          <div className="flex flex-col gap-y-6 md:w-[63%] md:shrink-0">
            <BodySection body={proposal.description || "No description was provided"} />
            <If condition={canFinalize && finalizeStatus !== "submitted"}>
              <FinalizeAction pollId={Number(proposal.pollId)} />
            </If>
            <If condition={hasAction}>
              <ProposalAction
                onExecute={() => executeProposal()}
                isConfirmingExecution={isConfirmingExecution}
                canExecute={canExecute}
                actions={proposal.actions}
              />
            </If>
          </div>
          <div className="flex flex-col gap-y-6 md:w-[33%]">
            <PollCard pollId={proposal.pollId} />
            <CardResources resources={proposal.resources} title="Resources" />
          </div>
        </div>
      </div>
    </section>
  );
}

function getShowProposalLoading(
  proposal: ReturnType<typeof useProposal>["proposal"],
  status: ReturnType<typeof useProposal>["status"]
) {
  if (!proposal && status.proposalLoading) return true;
  else if (status.metadataLoading && !status.metadataError) return true;
  else if (!proposal?.title && !status.metadataError) return true;

  return false;
}
