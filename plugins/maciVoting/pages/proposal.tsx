import { useProposal } from "@/plugins/maciVoting/hooks/useProposal";
import ProposalHeader from "@/plugins/maciVoting/components/proposal/header";
import { useProposalExecute } from "@/plugins/maciVoting/hooks/useProposalExecute";
import { BodySection } from "@/components/proposal/proposalBodySection";
import { ProposalAction } from "@/components/proposalAction/proposalAction";
import { CardResources } from "@/components/proposal/cardResources";
import { If } from "@/components/if";
import PollCard from "../components/PollCard";
import { FinalizeAction } from "../components/finalize/finalizeAction";
import { useCanFinalize } from "../hooks/useCanFinalize";

export default function ProposalDetail({ id: proposalId }: { id: string }) {
  const { proposal, proposalMetadata, creator, status } = useProposal(proposalId, true);
  const showProposalLoading = getShowProposalLoading(proposal, proposalMetadata, status);
  const hasAction = proposal?.actions?.length ?? 0 > 0;

  const canFinalize = useCanFinalize(proposal?.pollId);

  const { executeProposal, canExecute, isConfirming: isConfirmingExecution } = useProposalExecute(proposalId);

  if (!proposal || !proposalMetadata || !creator || showProposalLoading) {
    return (
      <div className="flex w-full flex-col gap-10">
        <div className="h-[250px] w-full bg-slate"></div>
        <div className="mx-auto grid w-full max-w-screen-xl grid-cols-3 gap-12">
          <div className="col-span-2 flex flex-col gap-6">
            <div className="h-[200px] w-full rounded-xl bg-slate"></div>
            <div className="h-[200px] w-full rounded-xl bg-slate"></div>
            <div className="h-[200px] w-full rounded-xl bg-slate"></div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="aspect-video w-full rounded-xl bg-slate"></div>
            <div className="h-[140px] w-full rounded-xl bg-slate"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="flex w-screen min-w-full max-w-full flex-col items-center">
      <ProposalHeader
        proposalNumber={Number(proposalId)}
        proposal={proposal}
        proposalMetadata={proposalMetadata}
        creator={creator}
        canExecute={canExecute}
        onExecutePressed={() => executeProposal()}
      />

      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-16 md:pb-20 md:pt-10">
        <div className="mg:gap-y-6 flex w-full flex-col gap-6 md:flex-row md:gap-x-12">
          <div className="flex flex-col gap-y-6 md:w-[63%] md:shrink-0">
            <BodySection body={proposalMetadata?.description || "No description was provided"} />
            <If condition={canFinalize}>
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
            <CardResources resources={proposalMetadata?.resources} title="Resources" />
          </div>
        </div>
      </div>
    </section>
  );
}

function getShowProposalLoading(
  proposal: ReturnType<typeof useProposal>["proposal"],
  proposalMetadata: ReturnType<typeof useProposal>["proposalMetadata"],
  status: ReturnType<typeof useProposal>["status"]
) {
  if (!proposal && status.proposalLoading) return true;
  else if (status.metadataLoading && !status.metadataError) return true;
  else if (!proposalMetadata?.title && !status.metadataError) return true;

  return false;
}
