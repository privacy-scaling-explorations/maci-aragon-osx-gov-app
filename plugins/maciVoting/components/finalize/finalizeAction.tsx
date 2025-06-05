import { useCallback, useMemo } from "react";
import { useCoordinator } from "../../hooks/useCoordinator";
import { Button } from "@aragon/ods";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { If } from "@/components/if";
import { useRouter } from "next/router";

interface IFinalizeActionProps {
  pollId: number;
}

export const FinalizeAction: React.FC<IFinalizeActionProps> = ({ pollId }) => {
  const router = useRouter();
  const { finalizeStatus, finalizeProposal } = useCoordinator();

  const finalizationMessage = useMemo(() => {
    switch (finalizeStatus) {
      case "notStarted":
        return "";
      case "merging":
        return <PleaseWaitSpinner fullMessage="Merging poll..." />;
      case "proving":
        return <PleaseWaitSpinner fullMessage="Generating proofs..." />;
      case "submitting":
        return <PleaseWaitSpinner fullMessage="Submitting proofs..." />;
      case "submitted":
        return "";
      default:
        return "";
    }
  }, [finalizeStatus]);

  const onClickFinalize = useCallback(async () => {
    await finalizeProposal(pollId);
    router.reload();
  }, [finalizeProposal, pollId, router]);

  return (
    <div className="overflow-hidden rounded-xl bg-neutral-0 pb-2 shadow-neutral">
      <If condition={finalizeStatus !== "submitted"}>
        <div className="flex flex-col gap-y-2 px-4 py-4 md:gap-y-3 md:px-6 md:py-6">
          <div className="flex justify-between gap-x-2 gap-y-2">
            <p className="text-xl leading-tight text-neutral-800 md:text-2xl">Finalize Poll</p>
            <Button size="md" disabled={finalizeStatus !== "notStarted"} onClick={onClickFinalize}>
              Finalize
            </Button>
          </div>
          <p className="text-base leading-normal text-neutral-500 md:text-lg">
            The poll must have ended in order for it to be finalized.
          </p>
          <p className="text-sm text-info-500">{finalizationMessage}</p>
        </div>
      </If>
      <If condition={finalizeStatus === "submitted"}>
        <div className="flex flex-col gap-y-2 px-4 py-4 md:gap-y-3 md:px-6 md:py-6">
          <div className="flex justify-between gap-x-2 gap-y-2">
            <p className="text-xl leading-tight text-neutral-800 md:text-2xl">Poll Finalized</p>
          </div>
          <p className="text-base leading-normal text-neutral-500 md:text-lg">
            The poll has been finalized. You can now execute the proposal.
          </p>
        </div>
      </If>
    </div>
  );
};
