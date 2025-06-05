import { useState, useEffect } from "react";
import { type Proposal } from "@/plugins/maciVoting/utils/types";
import { type ProposalStatus } from "@aragon/ods";
import dayjs from "dayjs";
import { useCoordinator } from "./useCoordinator";
import { useResults } from "./useResults";

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
  const { results } = useResults(proposal ? proposal.pollId : undefined);

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
      } else if (isTallied) {
        if (!results) {
          setStatus("pending");
          return;
        }

        const yesFlag = results[0].isSet;
        const noFlag = results[1].isSet;

        if (!yesFlag && !noFlag) {
          setStatus("pending");
        }

        const yesVotes = results[0].value;
        const noVotes = results[1].value;

        if (yesVotes > noVotes) {
          setStatus("accepted");
        } else {
          setStatus("rejected");
        }
      }
    })();
  }, [proposal, checkIsTallied, results]);

  return status;
};
