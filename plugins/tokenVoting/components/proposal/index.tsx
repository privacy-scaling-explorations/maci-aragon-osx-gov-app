import Link from "next/link";
import { useProposal } from "@/plugins/tokenVoting/hooks/useProposal";
import { getProposalStatusVariant } from "@/plugins/tokenVoting/utils/proposal-status";
import { Card, Tag } from "@aragon/ods";
import * as DOMPurify from "dompurify";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { If } from "@/components/if";

const DEFAULT_PROPOSAL_METADATA_TITLE = "(No proposal title)";
const DEFAULT_PROPOSAL_METADATA_SUMMARY = "(The metadata of the proposal is not available)";

type ProposalInputs = {
  proposalId: bigint;
  tokenSupply: bigint;
};

export default function ProposalCard(props: ProposalInputs) {
  const { proposal, status } = useProposal(props.proposalId.toString());

  const showLoading = getShowProposalLoading(proposal, status);

  if (!proposal || showLoading) {
    return (
      <section className="mb-4 w-full">
        <Card className="p-4">
          <span className="xs:px-10 px-4 py-5 md:px-6 lg:px-7">
            <PleaseWaitSpinner fullMessage="Loading proposal..." />
          </span>
        </Card>
      </section>
    );
  } else if (!proposal?.title && !proposal?.summary) {
    // We have the proposal but no metadata yet
    return (
      <Link href={`#/proposals/${props.proposalId}`} className="mb-4 w-full">
        <Card className="p-4">
          <span className="xs:px-10 px-4 py-5 md:px-6 lg:px-7">
            <PleaseWaitSpinner fullMessage="Loading metadata..." />
          </span>
        </Card>
      </Link>
    );
  } else if (status.metadataReady && !proposal?.title) {
    return (
      <Link href={`#/proposals/${props.proposalId}`} className="mb-4 w-full">
        <Card className="p-4">
          <div className="xl:4/5 overflow-hidden text-ellipsis text-nowrap pr-4 md:w-7/12 lg:w-3/4">
            <h4 className="mb-1 line-clamp-1 text-lg text-neutral-300">
              {Number(props.proposalId) + 1} - {DEFAULT_PROPOSAL_METADATA_TITLE}
            </h4>
            <p className="line-clamp-3 text-base text-neutral-300">{DEFAULT_PROPOSAL_METADATA_SUMMARY}</p>
          </div>
        </Card>
      </Link>
    );
  }

  const { variant: statusVariant, label: statusLabel } = getProposalStatusVariant(proposal, props.tokenSupply);

  return (
    <Link href={`#/proposals/${props.proposalId}`} className="w-full">
      <Card className="mb-4 w-full p-5">
        <div className="w-full">
          <If condition={proposal.tally}>
            <div className="mb-2 flex">
              <Tag variant={statusVariant as any} label={statusLabel} />
            </div>
          </If>

          <div className="overflow-hidden text-ellipsis">
            <h4 className=" text-dark mb-1 line-clamp-1 text-lg font-semibold">
              {Number(props.proposalId) + 1} - {proposal.title}
            </h4>
            <div
              className="box line-clamp-2 overflow-hidden text-ellipsis"
              dangerouslySetInnerHTML={{
                __html: proposal.summary ? DOMPurify.sanitize(proposal.summary) : DEFAULT_PROPOSAL_METADATA_SUMMARY,
              }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getShowProposalLoading(
  proposal: ReturnType<typeof useProposal>["proposal"],
  status: ReturnType<typeof useProposal>["status"]
) {
  if (!proposal || status.proposalLoading) return true;
  else if (status.metadataLoading && !status.metadataError) return true;
  else if (!proposal?.title && !status.metadataError) return true;

  return false;
}
