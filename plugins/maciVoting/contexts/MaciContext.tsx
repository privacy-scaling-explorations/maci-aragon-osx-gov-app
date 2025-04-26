import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { type MaciContextType } from "./types";
import { Keypair, PrivKey } from "@maci-protocol/domainobjs";
import { generateKeypair, signup } from "@maci-protocol/sdk";
import { PUB_MACI_ADDRESS } from "@/constants";
import { useSignMessage, useWalletClient } from "wagmi";

export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const MaciContext = createContext<MaciContextType | undefined>(undefined);

export const MaciProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const [initialVoiceCredits, setInitialVoiceCredits] = useState<number>(0);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [maciKeypair, setMaciKeypair] = useState<Keypair | undefined>();
  const [stateIndex, setStateIndex] = useState<string | undefined>(undefined);

  const { data: walletClient } = useWalletClient();
  const { signMessageAsync } = useSignMessage();

  const getKeypair = useCallback(async () => {
    const maciPrivateKey = localStorage.getItem("maciPrivateKey");
    if (maciPrivateKey) {
      const keypair = new Keypair(PrivKey.deserialize(maciPrivateKey));
      setMaciKeypair(keypair);
      return keypair;
    }

    const signature = await signMessageAsync({ message: `Sign to generate MACI keypair at ${window.location.origin}` });
    const { privateKey } = generateKeypair({ seed: BigInt(signature) });
    const keypair = new Keypair(PrivKey.deserialize(privateKey));
    setMaciKeypair(keypair);

    // save private key in localStorage
    localStorage.setItem("maciPrivateKey", keypair.privKey.serialize());
    return keypair;
  }, [signMessageAsync]);

  const onSignup = useCallback(async () => {
    setIsLoading(true);

    if (!walletClient) {
      setError("Wallet client not found");
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
        maciPubKey: maciKeypair.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer: walletClient as any,
      });
      setStateIndex(_stateIndex);
    } catch (error) {
      setIsRegistered(false);
      setError("Error signing up");
      setIsLoading(false);
    }

    setIsRegistered(true);
    setIsLoading(false);
  }, [maciKeypair, walletClient]);

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
      getKeypair,
      onSignup,
      onJoinPoll,
    }),
    [isLoading, error, initialVoiceCredits, isRegistered, maciKeypair, stateIndex, getKeypair, onSignup, onJoinPoll]
  );

  return <MaciContext.Provider value={value as MaciContextType}>{children}</MaciContext.Provider>;
};

export const useMaci = (): MaciContextType => {
  const maciContext = useContext(MaciContext);

  if (!maciContext) {
    throw new Error("Should use context inside provider.");
  }

  return maciContext;
};
