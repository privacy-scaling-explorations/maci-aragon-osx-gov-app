import { Button, Card, Heading } from "@aragon/ods";
import { useMaci } from "../contexts/MaciContext";
import { useCallback, useState } from "react";

const SignUpSection = () => {
  const { onSignup, maciKeypair, createKeypair, error: maciError } = useMaci();
  const [error] = useState<string | undefined>(maciError);

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
      <Button onClick={onClick}>{maciKeypair ? "Sign up" : "Generate keys"}</Button>
    </Card>
  );
};

export default SignUpSection;
