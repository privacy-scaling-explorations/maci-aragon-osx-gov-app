import { Button, Card, Heading, Spinner } from "@aragon/ods";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMaci } from "../hooks/useMaci";

const MaciCard = () => {
  const { onSignup, maciKeypair, isRegistered, isLoading, deleteKeypair, error: maciError } = useMaci();
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setError(maciError);
  }, [maciError]);

  const buttonMessage = useMemo(() => {
    if (isLoading) {
      return <Spinner size="sm" variant="neutral" className="-m-[2px] inline-block" />;
    }
    if (isRegistered) {
      return "Already signed up";
    }
    return "Sign up";
  }, [isRegistered, isLoading]);

  const onClick = useCallback(async () => {
    await onSignup();
  }, [onSignup]);

  return (
    <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
      <Heading size="h3">Maci Contract</Heading>
      <div className="flex flex-col justify-between">
        <p>You need to sign up your locally generated public key to the main Maci contract.</p>
        <p className="text-sm text-critical-500">{error}</p>
      </div>
      <Button onClick={onClick} disabled={isRegistered ?? isLoading}>
        {buttonMessage}
      </Button>
      {!!maciKeypair && (
        <Button size="sm" variant="secondary" disabled={!maciKeypair} onClick={deleteKeypair}>
          Delete keys
        </Button>
      )}
    </Card>
  );
};

export default MaciCard;
