import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { type MaciContextType } from "./types";
import { Keypair, PrivKey } from "@maci-protocol/domainobjs";
import { signup, generateKeypair, hasUserSignedUp } from "@maci-protocol/sdk/browser";
import { PUB_MACI_ADDRESS } from "@/constants";
import { useSignMessage } from "wagmi";
import { useEthersSigner } from "../hooks/useEthersSigner";

export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const MaciContext = createContext<MaciContextType | undefined>(undefined);

export const MaciProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const [initialVoiceCredits, setInitialVoiceCredits] = useState<number>(0);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [maciKeypair, setMaciKeypair] = useState<Keypair | undefined>();
  const [stateIndex, setStateIndex] = useState<string | undefined>(undefined);

  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();

  // check if maci private key is in localStorage
  useEffect(() => {
    (async () => {
      const maciPrivateKey = localStorage.getItem("maciPrivateKey");
      if (!maciPrivateKey) {
        return;
      }

      const keypair = new Keypair(PrivKey.deserialize(maciPrivateKey));
      setMaciKeypair(keypair);
    })();
  }, []);

  // check if user is registered
  useEffect(() => {
    (async () => {
      if (!signer) {
        setError("Signer not found");
        return;
      }

      if (!maciKeypair) {
        setError("Keypair not found");
        return;
      }

      try {
        const hasSignedUp = await hasUserSignedUp({
          maciAddress: PUB_MACI_ADDRESS,
          maciPublicKey: maciKeypair.pubKey.serialize(),
          signer,
        });

        setIsRegistered(hasSignedUp);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setIsRegistered(false);
      }
    })();
  }, [maciKeypair, signer]);

  const createKeypair = useCallback(async () => {
    const signature = await signMessageAsync({ message: `Sign to generate MACI keypair at ${window.location.origin}` });
    const { privateKey } = generateKeypair({ seed: BigInt(signature) });
    const keypair = new Keypair(PrivKey.deserialize(privateKey));

    // save private key in localStorage
    localStorage.setItem("maciPrivateKey", keypair.privKey.serialize());

    setMaciKeypair(keypair);
    return keypair;
  }, [signMessageAsync]);

  const onSignup = useCallback(async () => {
    setIsLoading(true);

    if (isRegistered) {
      setError("Already registered");
      setIsLoading(false);
      return;
    }

    if (!signer) {
      setError("Signer not found");
      setIsLoading(false);
      return;
    }

    if (!maciKeypair) {
      setError("Keypair not found");
      setIsLoading(false);
      return;
    }

    try {
      const { stateIndex: _stateIndex } = await signup({
        maciAddress: PUB_MACI_ADDRESS,
        maciPublicKey: maciKeypair.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      setStateIndex(_stateIndex);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      setIsRegistered(false);
      setError("Error signing up");
      setIsLoading(false);
    }

    setIsRegistered(true);
    setIsLoading(false);
  }, [isRegistered, maciKeypair, signer]);

  const onJoinPoll = useCallback(async (pollId: bigint) => {
    setIsLoading(true);

    setIsLoading(false);
  }, []);

  // const onVote = useCallback(() => {}, []);

  const value = useMemo<MaciContextType>(
    () => ({
      isLoading,
      error,
      initialVoiceCredits,
      isRegistered,
      maciKeypair,
      stateIndex,
      createKeypair,
      onSignup,
      onJoinPoll,
    }),
    [isLoading, error, initialVoiceCredits, isRegistered, maciKeypair, stateIndex, createKeypair, onSignup, onJoinPoll]
  );

  return <MaciContext.Provider value={value as MaciContextType}>{children}</MaciContext.Provider>;
};
