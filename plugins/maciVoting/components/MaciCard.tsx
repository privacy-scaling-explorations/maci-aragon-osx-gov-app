import { Button, Card, Heading } from "@aragon/ods";
import { useCallback, useMemo, useState } from "react";
import { useMaci } from "../hooks/useMaci";

const MaciCard = () => {
  const { onSignup, maciKeypair, isRegistered, createKeypair, error: maciError } = useMaci();
  const [error] = useState<string | undefined>(maciError);

  const buttonMessage = useMemo(() => {
    if (isRegistered) {
      return "Already signed up";
    } else {
      if (!maciKeypair) {
        return "Generate keys";
      } else {
        return "Sign up";
      }
    }
  }, [maciKeypair, isRegistered]);

  const onClick = useCallback(async () => {
    if (!maciKeypair) {
      await createKeypair();
    } else {
      await onSignup();
    }
  }, [createKeypair, maciKeypair, onSignup]);

  return (
    <Card className="flex flex-col gap-y-4 p-6 shadow-neutral">
      <Heading size="h3">Maci Contract</Heading>
      <div className="flex flex-col justify-between">
        <p>You need to sign up your locally generated public key to the main Maci contract.</p>
        <p className="text-sm text-critical-500">{error}</p>
      </div>
      <Button onClick={onClick} disabled={isRegistered}>
        {buttonMessage}
      </Button>
    </Card>
  );
};

export default MaciCard;
