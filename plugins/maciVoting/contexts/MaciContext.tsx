import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { type MaciContextType } from "./types";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import {
  signup,
  generateKeypair,
  hasUserSignedUp,
  getJoinedUserData,
  MACI__factory as MACIFactory,
  generateMaciStateTreeWithEndKey,
  downloadPollJoiningArtifactsBrowser,
  joinPoll,
} from "@maci-protocol/sdk/browser";
import { PUB_MACI_ADDRESS } from "@/constants";
import { useSignMessage } from "wagmi";
import { useEthersSigner } from "../hooks/useEthersSigner";

export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const MaciContext = createContext<MaciContextType | undefined>(undefined);

export const MaciProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // MACI contract
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [maciKeypair, setMaciKeypair] = useState<Keypair | undefined>();
  const [stateIndex, setStateIndex] = useState<string | undefined>(undefined);
  const [stateTree, setStateTree] = useState<
    Awaited<ReturnType<typeof generateMaciStateTreeWithEndKey>> | null | undefined
  >();

  // Poll contract
  const [pollId, setPollId] = useState<bigint | undefined>(undefined);
  const [hasJoinedPoll, setHasJoinedPoll] = useState<boolean>(false);
  const [initialVoiceCredits, setInitialVoiceCredits] = useState<number>(0);
  const [pollStateIndex, setPollStateIndex] = useState<string | undefined>(undefined);

  // Wallet variables
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();

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
      setError(undefined);
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
          maciPublicKey: maciKeypair.publicKey.serialize(),
          signer,
        });

        setIsRegistered(hasSignedUp);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setIsRegistered(false);
      }
    })();
  }, [maciKeypair, signer]);

  // check poll user data
  useEffect(() => {
    (async () => {
      console.log("Checking poll user data");
      setError(undefined);
      if (!signer) {
        setError("Signer not found");
        return;
      }

      if (!maciKeypair) {
        setError("Keypair not found");
        setIsLoading(false);
        return;
      }

      if (!isRegistered) {
        setError("User not registered");
        setIsLoading(false);
        return;
      }

      if (!pollId) {
        setIsLoading(false);
        return;
      }

      try {
        const startBlock = (await signer.provider?.getBlockNumber()) || 0;
        const { isJoined, voiceCredits, pollStateIndex } = await getJoinedUserData({
          maciAddress: PUB_MACI_ADDRESS,
          pollId,
          pollPublicKey: maciKeypair.publicKey.serialize(),
          signer,
          startBlock: 0,
        });
        console.log("isJoined", isJoined);

        const maciContract = MACIFactory.connect(PUB_MACI_ADDRESS, signer);
        const localStateTree = await generateMaciStateTreeWithEndKey({
          maciContract,
          signer,
          userPublicKey: maciKeypair.publicKey,
        });
        // const localInclusionProof = stateTree.signUpTree.generateProof(Number(stateIndex));

        setHasJoinedPoll(isJoined);
        setInitialVoiceCredits(Number(voiceCredits));
        setPollStateIndex(pollStateIndex);
        setStateTree(localStateTree);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.log(error);
        setError("Error checking if user has joined poll");
      }
    })();
  }, [isRegistered, maciKeypair, pollId, signer, stateIndex]);

  const createKeypair = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);
    const signature = await signMessageAsync({ message: `Sign to generate MACI keypair at ${window.location.origin}` });
    const { privateKey } = generateKeypair({ seed: BigInt(signature) });
    const keypair = new Keypair(PrivateKey.deserialize(privateKey));

    // save private key in localStorage
    localStorage.setItem("maciPrivateKey", keypair.privateKey.serialize());

    setMaciKeypair(keypair);
    setIsLoading(false);
    return keypair;
  }, [signMessageAsync]);

  const onSignup = useCallback(async () => {
    setError(undefined);
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
        maciPublicKey: maciKeypair.publicKey.serialize(),
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

  const onJoinPoll = useCallback(
    async (pollId: bigint) => {
      setError(undefined);
      setIsLoading(true);
      console.log("Joining poll", pollId);

      console.log(signer);
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
      if (!stateTree) {
        setError("State tree not found");
        setIsLoading(false);
        return;
      }

      console.log("before inclusion proof");

      const inclusionProof = stateTree.signUpTree.generateProof(Number(stateIndex));
      const { zKey, wasm } = await downloadPollJoiningArtifactsBrowser({
        testing: true,
        stateTreeDepth: 10,
      });

      console.log("before join poll");
      await joinPoll({
        maciAddress: PUB_MACI_ADDRESS,
        privateKey: maciKeypair.privateKey.serialize(),
        stateIndex: 3n,
        signer,
        pollId: 0n,
        inclusionProof,
        pollJoiningZkey: zKey as unknown as string,
        pollWasm: wasm as unknown as string,
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
      });

      console.log("after join poll");

      setIsLoading(false);
    },
    [maciKeypair, signer, stateIndex, stateTree]
  );

  // const onVote = useCallback(() => {}, []);

  const value = useMemo<MaciContextType>(
    () => ({
      isLoading,
      error,
      pollId,
      setPollId,
      hasJoinedPoll,
      initialVoiceCredits,
      pollStateIndex,
      isRegistered,
      maciKeypair,
      stateIndex,
      createKeypair,
      onSignup,
      onJoinPoll,
    }),
    [
      isLoading,
      error,
      pollId,
      hasJoinedPoll,
      initialVoiceCredits,
      pollStateIndex,
      isRegistered,
      maciKeypair,
      stateIndex,
      createKeypair,
      onSignup,
      onJoinPoll,
    ]
  );

  return <MaciContext.Provider value={value as MaciContextType}>{children}</MaciContext.Provider>;
};
