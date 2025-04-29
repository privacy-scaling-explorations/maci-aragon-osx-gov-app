import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { type MaciContextType } from "./types";
import { Keypair, PrivKey } from "@maci-protocol/domainobjs";
import { signup, generateKeypair } from "@maci-protocol/sdk/browser";
import { PUB_MACI_ADDRESS } from "@/constants";
import { type Config, useConnectorClient, useSignMessage, useWalletClient } from "wagmi";

import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Account, Chain, Client, Transport } from "viem";

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;

  console.log(client);
  console.log(chain.id);
  console.log(chain.name);
  console.log(account.address);

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}

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

  const signer = useEthersSigner();

  const createKeypair = useCallback(async () => {
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
      console.log("Signing up...");
      console.log(signer);
      const { stateIndex: _stateIndex } = await signup({
        maciAddress: PUB_MACI_ADDRESS,
        maciPublicKey: maciKeypair.pubKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      console.log("Signed up successfully");
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
      createKeypair,
      onSignup,
      onJoinPoll,
    }),
    [isLoading, error, initialVoiceCredits, isRegistered, maciKeypair, stateIndex, createKeypair, onSignup, onJoinPoll]
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
