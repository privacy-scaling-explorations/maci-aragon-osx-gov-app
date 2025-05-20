import { useCoordinator } from "../../hooks/useCoordinator";
import { Button } from "@aragon/ods";

interface IFinalizeActionProps {
  pollId: number;
}

export const FinalizeAction: React.FC<IFinalizeActionProps> = ({ pollId }) => {
  const { finalizeStatus, finalizeProposal } = useCoordinator();

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
        {finalizeStatus === "merging" && <p>Merging poll...</p>}
        {finalizeStatus === "merged" && <p>The poll has been merged.</p>}
        {finalizeStatus === "proving" && <p>Generating proofs...</p>}
        {finalizeStatus === "proved" && <p>The proofs have been generated.</p>}
        {finalizeStatus === "submitting" && <p>Submitting proofs...</p>}
        {finalizeStatus === "submitted" && <p>The proofs have been submitted. You can now execute the proposal.</p>}
      </div>
    </div>
  );
};
