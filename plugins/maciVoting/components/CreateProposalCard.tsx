import { Button, Card } from "@aragon/ods";
import { useRouter } from "next/router";
import { useCallback } from "react";

const CreateProposalCard = () => {
  const { push } = useRouter();

  const onClick = useCallback(() => {
    push("#/new");
  }, [push]);

  return (
    <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
      <Button onClick={onClick}>Create new proposal</Button>
    </Card>
  );
};

export default CreateProposalCard;
