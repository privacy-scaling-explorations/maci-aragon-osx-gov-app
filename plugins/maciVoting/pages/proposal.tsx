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
import { useEthersSigner } from "../hooks/useEthersSigner";
import { usePublicClient } from "wagmi";

export default function ProposalDetail({ id: proposalId }: { id: string }) {
  const { proposal, status } = useProposal(proposalId, true);
  const showProposalLoading = getShowProposalLoading(proposal, status);
  const hasAction = proposal?.actions?.length ?? 0 > 0;

  const { finalizeStatus } = useCoordinator();
  const canFinalize = useCanFinalize(proposal?.pollId);

  const { executeProposal, canExecute, isConfirming: isConfirmingExecution } = useProposalExecute(proposalId);

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
