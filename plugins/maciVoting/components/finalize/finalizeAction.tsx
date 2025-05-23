import { useMemo } from "react";
import { useCoordinator } from "../../hooks/useCoordinator";
import { Button } from "@aragon/ods";

interface IFinalizeActionProps {
  pollId: number;
}

export const FinalizeAction: React.FC<IFinalizeActionProps> = ({ pollId }) => {
  const { finalizeStatus, finalizeProposal } = useCoordinator();

  const finalizationMessage = useMemo(() => {
    switch (finalizeStatus) {
      case "notStarted":
        return "";
      case "merging":
        return "Merging poll...";
      case "merged":
        return "The poll has been merged.";
      case "proving":
        return "Generating proofs...";
      case "proved":
        return "The proofs have been generated.";
      case "submitting":
        return "Submitting proofs...";
      case "submitted":
        return "The proofs have been submitted. You can now execute the proposal.";
      default:
        return "";
    }
  }, [finalizeStatus]);

  return (
    <div className="overflow-hidden rounded-xl bg-neutral-0 pb-2 shadow-neutral">
      <div className="flex flex-col gap-y-2 px-4 py-4 md:gap-y-3 md:px-6 md:py-6">
        <div className="flex justify-between gap-x-2 gap-y-2">
          <p className="text-xl leading-tight text-neutral-800 md:text-2xl">Finalize Poll</p>
          <Button size="md" disabled={finalizeStatus !== "notStarted"} onClick={() => finalizeProposal(pollId)}>
            Finalize
          </Button>
        </div>
        <p className="text-base leading-normal text-neutral-500 md:text-lg">
          The poll must have ended in order for it to be finalized.
        </p>
        <p className="text-sm text-info-500">{finalizationMessage}</p>
      </div>
    </div>
  );
};
