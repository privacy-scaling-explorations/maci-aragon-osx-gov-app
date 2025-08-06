import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { useAlerts } from "@/context/Alerts";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import {
  downloadPollJoiningArtifactsBrowser,
  generateKeypair,
  getSignedupUserData,
  signup,
} from "@maci-protocol/sdk/browser";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { keccak256, stringToHex } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { type IMaciContextType } from "./types";

export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const MaciContext = createContext<IMaciContextType | undefined>(undefined);

export const MaciProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const { addAlert } = useAlerts();

  // MACI contract
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [maciKeypair, setMaciKeypair] = useState<Keypair | undefined>();
  const [stateIndex, setStateIndex] = useState<string | undefined>(undefined);

  // Artifacts
  const [artifacts, setArtifacts] = useState<
    Awaited<ReturnType<typeof downloadPollJoiningArtifactsBrowser>> | undefined
  >();

  // Wallet variables
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();

  // Functions
  const deleteKeypair = useCallback(() => {
    localStorage.removeItem("maciPrivateKey");

    setIsRegistered(false);
    setMaciKeypair(undefined);
    setStateIndex(undefined);

    setArtifacts(undefined);

    setError(undefined);
  }, []);

  const onSignup = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);

    if (!isConnected) {
      setError("Wallet not connected");
      setIsLoading(false);
      return;
    }

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

    let keypair = maciKeypair;
    if (!keypair) {
      try {
        const signature = await signMessageAsync({
          message: `Sign to generate MACI keypair at ${window.location.origin}`,
        });
        const signatureHash = keccak256(stringToHex(signature));
        const { privateKey } = generateKeypair({ seed: BigInt(signatureHash) });
        keypair = new Keypair(PrivateKey.deserialize(privateKey));
        localStorage.setItem("maciPrivateKey", keypair.privateKey.serialize());

        setMaciKeypair(keypair);
      } catch (error) {
        setError("Error creating keypair");
        setIsLoading(false);
        return;
      }
    }

    let isUserRegistered = false;
    try {
      const { isRegistered: _isRegistered } = await getSignedupUserData({
        maciAddress: PUBLIC_MACI_ADDRESS,
        maciPublicKey: keypair.publicKey.serialize(),
        signer,
      });

      isUserRegistered = _isRegistered;
      setIsRegistered(_isRegistered);
    } catch (error) {
      setError("Error checking if user is registered");
      setIsLoading(false);
      return;
    }

    if (isUserRegistered) {
      setIsLoading(false);
      addAlert("You're already signed up to MACI contract", {
        description: "Now you can join any poll of this MACI contract",
        type: "success",
      });
      return;
    }

    try {
      const { stateIndex: _stateIndex } = await signup({
        maciAddress: PUBLIC_MACI_ADDRESS,
        maciPublicKey: keypair.publicKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      setStateIndex(_stateIndex);
      setIsRegistered(true);
      setIsLoading(false);
      addAlert("Signed up to MACI contract", {
        description: "Now you can join any poll of this MACI contract",
        type: "success",
      });
    } catch (error) {
      setError("Error signing up");
      setIsLoading(false);
    }
  }, [addAlert, isConnected, isRegistered, maciKeypair, signMessageAsync, signer]);

  // check if maci private key is in localStorage
  useEffect(() => {
    (async () => {
      const maciPrivateKey = localStorage.getItem("maciPrivateKey");
      if (!maciPrivateKey) {
        return;
      }

      const keypair = new Keypair(PrivateKey.deserialize(maciPrivateKey));
      setMaciKeypair(keypair);
    })();
  }, []);

  // check if user is registered
  useEffect(() => {
    (async () => {
      if (!isConnected || !signer || !maciKeypair) {
        setIsRegistered(false);
        setStateIndex(undefined);
        return;
      }

      try {
        const { isRegistered: _isRegistered, stateIndex: _stateIndex } = await getSignedupUserData({
          maciAddress: PUBLIC_MACI_ADDRESS,
          maciPublicKey: maciKeypair.publicKey.serialize(),
          signer,
        });

        setIsRegistered(_isRegistered);
        setStateIndex(_stateIndex);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        setError("Error checking if user is registered and generating state tree");
      }
    })();
  }, [isConnected, maciKeypair, signer, stateIndex]);

  // download poll joining artifacts and store them in state
  useEffect(() => {
    (async () => {
      const downloadedArtifacts = await downloadPollJoiningArtifactsBrowser({
        testing: true,
        stateTreeDepth: 10,
      });
      setArtifacts(downloadedArtifacts);
    })();
  }, []);

  const value = useMemo<IMaciContextType>(
    () => ({
      isLoading,
      error,
      isRegistered,
      maciKeypair,
      stateIndex,
      artifacts,
      deleteKeypair,
      onSignup,
    }),
    [isLoading, error, isRegistered, maciKeypair, stateIndex, artifacts, deleteKeypair, onSignup]
  );

  return <MaciContext.Provider value={value as IMaciContextType}>{children}</MaciContext.Provider>;
};
