import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { type MaciContextType } from "./types";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import {
  signup,
  generateKeypair,
  getJoinedUserData,
  MACI__factory as MACIFactory,
  generateMaciStateTreeWithEndKey,
  downloadPollJoiningArtifactsBrowser,
  joinPoll,
  getPoll,
  publish,
  getSignedupUserData,
} from "@maci-protocol/sdk/browser";
import { PUBLIC_MACI_ADDRESS, PUBLIC_MACI_DEPLOYMENT_BLOCK } from "@/constants";
import { useAccount, usePublicClient, useSignMessage } from "wagmi";
import { useEthersSigner } from "../hooks/useEthersSigner";
import { keccak256, stringToHex, type Hex } from "viem";
import { VoteOption } from "../utils/types";
import { useAlerts } from "@/context/Alerts";

export const DEFAULT_SG_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const DEFAULT_IVCP_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const MaciContext = createContext<MaciContextType | undefined>(undefined);

export const MaciProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const { addAlert } = useAlerts();

  // MACI contract
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [maciKeypair, setMaciKeypair] = useState<Keypair | undefined>();
  const [stateIndex, setStateIndex] = useState<string | undefined>(undefined);
  const [inclusionProof, setInclusionProof] = useState<any>(null);

  // Artifacts
  const [artifacts, setArtifacts] = useState<
    Awaited<ReturnType<typeof downloadPollJoiningArtifactsBrowser>> | undefined
  >();

  // Poll contract
  const [pollDeployBlock, setPollDeployBlock] = useState<number | undefined>(undefined);
  const [pollId, setPollId] = useState<bigint | undefined>(undefined);
  const [hasJoinedPoll, setHasJoinedPoll] = useState<boolean>(false);
  const [initialVoiceCredits, setInitialVoiceCredits] = useState<number>(0);
  const [pollStateIndex, setPollStateIndex] = useState<string | undefined>(undefined);

  // Wallet variables
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();
  const publicClient = usePublicClient();

  // Functions
  const createKeypair = useCallback(async () => {
    setError(undefined);
    setIsLoading(true);

    if (!isConnected) {
      setError("Wallet not connected");
      setIsLoading(false);
      return;
    }

    try {
      const signature = await signMessageAsync({
        message: `Sign to generate MACI keypair at ${window.location.origin}`,
      });
      const signatureHash = keccak256(stringToHex(signature));
      const { privateKey } = generateKeypair({ seed: BigInt(signatureHash) });
      const keypair = new Keypair(PrivateKey.deserialize(privateKey));

      // save private key in localStorage
      localStorage.setItem("maciPrivateKey", keypair.privateKey.serialize());
      localStorage.setItem("address", address ?? "");

      setMaciKeypair(keypair);
      setIsLoading(false);
      setError(undefined);
      return keypair;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating keypair", error);
      setMaciKeypair(undefined);
      setError("Error creating keypair");
      setIsLoading(false);
      return;
    }
  }, [address, isConnected, signMessageAsync]);

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
        maciAddress: PUBLIC_MACI_ADDRESS,
        maciPublicKey: maciKeypair.publicKey.serialize(),
        sgData: DEFAULT_SG_DATA,
        signer,
      });
      setStateIndex(_stateIndex);
      setIsRegistered(true);
      setIsLoading(false);
      setError(undefined);

      addAlert("Signed up to MACI contract", {
        description: "Now you can join any poll of this MACI contract",
        type: "success",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      setIsRegistered(false);
      setError("Error signing up");
      setIsLoading(false);
    }
  }, [isRegistered, maciKeypair, signer]);

  const onJoinPoll = useCallback(
    async (pollId: bigint) => {
      setError(undefined);
      setIsLoading(true);

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
      if (!isRegistered) {
        setError("User not registered");
        setIsLoading(false);
        return;
      }
      if (!stateIndex) {
        setError("State index not found");
        setIsLoading(false);
        return;
      }
      if (!artifacts) {
        setError("Artifacts not downloaded");
        setIsLoading(false);
        return;
      }
      if (!pollId && pollId !== 0n) {
        setIsLoading(false);
        return;
      }
      if (hasJoinedPoll) {
        setError("Already joined poll");
        setIsLoading(false);
        return;
      }

      const joinedPoll = await joinPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        privateKey: maciKeypair.privateKey.serialize(),
        signer,
        pollId,
        inclusionProof,
        pollJoiningZkey: artifacts.zKey as unknown as string,
        pollWasm: artifacts.wasm as unknown as string,
        sgDataArg: DEFAULT_SG_DATA,
        ivcpDataArg: DEFAULT_IVCP_DATA,
      });

      setHasJoinedPoll(true);
      setInitialVoiceCredits(Number(joinedPoll.voiceCredits));
      setPollStateIndex(joinedPoll.pollStateIndex);

      setIsLoading(false);

      addAlert("Joined the poll", {
        description: "Now you can submit your vote to this poll",
        type: "success",
      });
    },
    [addAlert, artifacts, hasJoinedPoll, inclusionProof, isRegistered, maciKeypair, signer, stateIndex]
  );

  const onVote = useCallback(
    async (option: VoteOption) => {
      setError(undefined);
      setIsLoading(true);

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

      if (!pollId) {
        setIsLoading(false);
        return;
      }

      if (!stateIndex) {
        setError("State index not found");
        setIsLoading(false);
        return;
      }

      if (!hasJoinedPoll) {
        setError("User has not joined the poll");
        setIsLoading(false);
        return;
      }

      let voteOptionIndex: bigint;
      switch (option) {
        case VoteOption.Yes:
          voteOptionIndex = 0n;
          break;
        case VoteOption.No:
          voteOptionIndex = 1n;
          break;
        case VoteOption.Abstain:
          voteOptionIndex = 2n;
          break;
      }

      await publish({
        publicKey: maciKeypair.publicKey.serialize(),
        stateIndex: BigInt(stateIndex),
        voteOptionIndex,
        nonce: 0n, // should we keep this in local or is it onchain?
        pollId,
        newVoteWeight: 1n,
        maciAddress: PUBLIC_MACI_ADDRESS,
        privateKey: maciKeypair.privateKey.serialize(),
        signer,
      });

      setIsLoading(false);
      setError(undefined);

      addAlert("Vote submitted", {
        description: "Your vote is in the ballot. You can submit another vote to override it.",
        type: "success",
      });
    },
    [addAlert, hasJoinedPoll, maciKeypair, pollId, signer, stateIndex]
  );

  // check if user is connected
  useEffect(() => {
    setError(undefined);
    if (!isConnected) {
      setMaciKeypair(undefined);
      setIsRegistered(false);
      setStateIndex(undefined);
    }
  }, [isConnected]);

  // get deploy block numbers of Poll contract
  useEffect(() => {
    (async () => {
      setPollDeployBlock(undefined);
      if (!signer) {
        return;
      }

      if (!pollId) {
        return;
      }

      if (!publicClient) {
        return;
      }

      const { address } = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });

      const logs = await publicClient.getLogs({
        address: address as Hex,
        fromBlock: BigInt(PUBLIC_MACI_DEPLOYMENT_BLOCK),
        toBlock: "latest",
      });

      if (logs.length === 0) {
        setPollDeployBlock(PUBLIC_MACI_DEPLOYMENT_BLOCK);
        return;
      }

      const pollDeployBlock = logs[0].blockNumber;
      setPollDeployBlock(Number(pollDeployBlock));
    })();
  }, [pollId, publicClient, signer]);

  // check if maci private key is in localStorage
  useEffect(() => {
    (async () => {
      const savedAddress = localStorage.getItem("address");
      if (savedAddress !== address) {
        localStorage.removeItem("maciPrivateKey");
        localStorage.removeItem("address");
        setMaciKeypair(undefined);
        setIsRegistered(false);
        return;
      }

      const maciPrivateKey = localStorage.getItem("maciPrivateKey");
      if (!maciPrivateKey) {
        await createKeypair();
        return;
      }

      const keypair = new Keypair(PrivateKey.deserialize(maciPrivateKey));
      setMaciKeypair(keypair);
    })();
  }, [address, createKeypair]);

  // check if user is registered
  useEffect(() => {
    (async () => {
      if (!signer) {
        setIsRegistered(false);
        return;
      }

      if (!maciKeypair) {
        setIsRegistered(false);
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
        setIsRegistered(false);
      }
    })();
  }, [maciKeypair, signer]);

  // generate maci state tree locally
  useEffect(() => {
    (async () => {
      if (!signer) {
        setInclusionProof(null);
        return;
      }

      if (!maciKeypair) {
        setInclusionProof(null);
        return;
      }

      if (!isRegistered) {
        setInclusionProof(null);
        return;
      }

      try {
        const maciContract = MACIFactory.connect(PUBLIC_MACI_ADDRESS, signer);
        const stateTree = await generateMaciStateTreeWithEndKey({
          maciContract,
          signer,
          userPublicKey: maciKeypair.publicKey,
          startBlock: PUBLIC_MACI_DEPLOYMENT_BLOCK,
        });

        const localInclusionProof = stateTree.signUpTree.generateProof(Number(stateIndex));

        setInclusionProof(localInclusionProof);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        setError("Error generating MACI state tree");
        setInclusionProof(null);
      }
    })();
  }, [isRegistered, maciKeypair, pollId, signer, stateIndex]);

  // check poll user data
  useEffect(() => {
    (async () => {
      setHasJoinedPoll(false);
      setInitialVoiceCredits(0);
      setPollStateIndex(undefined);

      if (!signer) {
        return;
      }

      if (!maciKeypair) {
        return;
      }

      if (!isRegistered) {
        return;
      }

      if (!pollId) {
        return;
      }

      try {
        const { isJoined, voiceCredits, pollStateIndex } = await getJoinedUserData({
          maciAddress: PUBLIC_MACI_ADDRESS,
          pollId,
          pollPublicKey: maciKeypair.publicKey.serialize(),
          signer,
          startBlock: pollDeployBlock ?? PUBLIC_MACI_DEPLOYMENT_BLOCK,
        });

        console.log(isJoined, voiceCredits, pollStateIndex);
        console.log(hasJoinedPoll, initialVoiceCredits, pollStateIndex);

        setHasJoinedPoll(isJoined);
        setInitialVoiceCredits(Number(voiceCredits));
        setPollStateIndex(pollStateIndex);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        setError("Error checking if user has joined poll");
      }
    })();
  }, [isRegistered, maciKeypair, pollDeployBlock, pollId, signer, stateIndex]);

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
      onVote,
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
      onVote,
    ]
  );

  return <MaciContext.Provider value={value as MaciContextType}>{children}</MaciContext.Provider>;
};
