import { useState, useEffect } from "react";
import { type Proposal } from "@/plugins/maciVoting/utils/types";
import { type ProposalStatus } from "@aragon/ods";
import dayjs from "dayjs";
import { useCoordinator } from "./useCoordinator";

export const useProposalVariantStatus = (proposal: Proposal) => {
  const [status, setStatus] = useState({ variant: "", label: "" });

  useEffect(() => {
    if (!proposal || !proposal?.parameters) return;
    setStatus(
      proposal?.tally?.yes >= proposal?.tally?.no
        ? proposal?.executed
          ? { variant: "success", label: "Executed" }
          : { variant: "success", label: "Executable" }
        : dayjs().isAfter(dayjs(Number(proposal?.parameters.endDate) * 1000))
          ? { variant: "critical", label: "Failed" }
          : { variant: "info", label: "Active" }
    );
  }, [proposal, proposal?.tally, proposal?.executed]);

  return status;
};

export const useProposalStatus = (proposal: Proposal) => {
  const [status, setStatus] = useState<ProposalStatus>();
  const { checkIsTallied } = useCoordinator();

  useEffect(() => {
    (async () => {
      if (!proposal || !proposal?.parameters || !proposal?.tally) return;

      const isExecuted = proposal.executed;
      const endDate = dayjs(Number(proposal.parameters.endDate) * 1000);
      const isActive = dayjs().isBefore(endDate);
      const isTallied = await checkIsTallied(Number(proposal.pollId));

      if (isExecuted) {
        setStatus("executed");
      } else if (isActive) {
        setStatus("active");
      } else if (!isTallied) {
        setStatus("pending");
      } else if (!isActive) {
        setStatus("rejected");
      } else {
        setStatus("accepted");
      }
    })();
  }, [proposal, proposal?.tally, proposal.executed, checkIsTallied]);

  return status;
};
