import {
  AvatarIcon,
  Breadcrumbs,
  Button,
  Heading,
  IBreadcrumbsLink,
  IconType,
  Tag,
  type TagVariant,
} from "@aragon/ods";
import { type ProposalMetadata, type Proposal } from "@/plugins/maciVoting/utils/types";
import { useProposalStatus } from "@/plugins/maciVoting/hooks/useProposalVariantStatus";
import dayjs from "dayjs";
import classNames from "classnames";
import { type ReactNode } from "react";
import { Publisher } from "@/components/publisher";
import { getSimpleRelativeTimeFromDate } from "@/utils/dates";
import { unixTimestampToDate } from "../../utils/formatPollDate";

interface ProposalHeaderProps {
  proposalNumber: number;
  proposal: Proposal;
  proposalMetadata: ProposalMetadata;
  creator: string;
  canExecute: boolean;
  onExecutePressed: () => void;
}

const ProposalHeader: React.FC<ProposalHeaderProps> = ({ proposal, proposalMetadata, creator }) => {
  const status = useProposalStatus(proposal);
  const tagVariant = getTagVariantFromStatus(status);

  const expired = proposal.parameters.endDate <= Date.now() / 1000;

  return (
    <div className="flex w-full justify-center bg-neutral-0">
      {/* Wrapper */}
      <MainSection className="flex flex-col gap-y-6 md:px-16 md:py-10">
        {/* Title & description */}
        <div className="flex w-full flex-col gap-y-2">
          <div className="flex w-full items-center gap-x-4">
            <Heading size="h1">{proposalMetadata.title}</Heading>
            {/* && <Tag label="Emergency" variant="critical" />*/}
          </div>
          <p className="text-lg leading-normal text-neutral-500">{proposalMetadata.summary}</p>
        </div>
        {/* Metadata */}
        <div className="flex flex-wrap items-start gap-x-10 gap-y-2">
          <div className="flex items-center gap-x-2">
            <AvatarIcon icon={IconType.APP_MEMBERS} size="sm" variant="primary" />
            <Publisher publisher={[{ address: creator }]} />
          </div>

          <div className="flex flex-col items-start gap-y-2">
            <div className="flex items-center gap-x-2">
              <AvatarIcon icon={IconType.CALENDAR} size="sm" variant="primary" />
              <div className="flex gap-x-1 text-base leading-tight ">
                <span className="text-neutral-500">Start date: </span>
                <span className="text-neutral-800">{unixTimestampToDate(proposal.parameters.startDate)}</span>
              </div>
            </div>
            {proposal.parameters.startDate > Date.now() / 1000 && (
              <div className="flex items-center">
                <span className="w-8"></span>
                <span className="text-neutral-500">
                  In {getSimpleRelativeTimeFromDate(dayjs(Number(proposal.parameters.startDate) * 1000))}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-y-2">
            <div className="flex items-center gap-x-2">
              <AvatarIcon icon={IconType.CALENDAR} size="sm" variant="primary" />
              <div className="flex gap-x-1 text-base leading-tight ">
                <span className="text-neutral-500">End date: </span>
                <span className="text-neutral-800">{unixTimestampToDate(proposal.parameters.endDate)}</span>
              </div>
            </div>
            {proposal.parameters.endDate > Date.now() / 1000 && (
              <div className="flex items-center">
                <span className="w-8"></span>
                <span className="text-neutral-500">
                  In {getSimpleRelativeTimeFromDate(dayjs(Number(proposal.parameters.endDate) * 1000))}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-y-2">
            <div className="flex items-center gap-x-2">
              <AvatarIcon icon={IconType.APP_PROPOSALS} size="sm" variant={tagVariant} />
              <div className="flex gap-x-1 text-base leading-tight ">
                <span className="text-neutral-500">Proposal status: </span>
                <span className="text-neutral-800">{status}</span>
              </div>
            </div>
          </div>
        </div>
      </MainSection>
    </div>
  );
};

export default ProposalHeader;

interface IMainSectionProps {
  children?: ReactNode;
  className?: string;
}
const MainSection: React.FC<IMainSectionProps> = (props) => {
  const { children, className } = props;

  return <div className={classNames("mx-auto w-full max-w-screen-xl px-4 py-6", className)}>{children}</div>;
};

const getTagVariantFromStatus = (status: string | undefined): TagVariant => {
  switch (status) {
    case "accepted":
      return "success";
    case "active":
      return "info";
    case "challenged":
      return "warning";
    case "draft":
      return "neutral";
    case "executed":
      return "success";
    case "expired":
      return "critical";
    case "failed":
      return "critical";
    case "partiallyExecuted":
      return "warning";
    case "pending":
      return "neutral";
    case "queued":
      return "success";
    case "rejected":
      return "critical";
    case "vetoed":
      return "warning";
    default:
      return "neutral";
  }
};
