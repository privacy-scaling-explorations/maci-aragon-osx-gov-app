import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { type IMaciContextType } from "./types";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import {
  signup,
  generateKeypair,
  getJoinedUserData,
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
import { unixTimestampToDate } from "../utils/formatPollDate";

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
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signer = useEthersSigner();
  const publicClient = usePublicClient();

  // Functions
  const deleteKeypair = useCallback(() => {
    localStorage.removeItem("maciPrivateKey");
    setMaciKeypair(undefined);
    setIsRegistered(false);
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
      }).catch((error) => {
        if (error.message.includes("0xa3281672")) {
          // 0xa3281672 -> signature of BalanceTooLow()
          setError(`Address balance is too low to join the poll`);
          setIsLoading(false);
          return;
        }
        // eslint-disable-next-line no-console
        console.log("Error joining poll", error);
        setError("Error joining poll");
        return;
      });

      if (!joinedPoll) {
        setIsLoading(false);
        return;
      }

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

      if (!pollStateIndex) {
        setError("Poll state index not found");
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

      const poll = await getPoll({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollId,
        signer,
      });
      if (!poll) {
        return;
      }

      try {
        await publish({
          publicKey: maciKeypair.publicKey.serialize(),
          stateIndex: BigInt(pollStateIndex),
          voteOptionIndex,
          nonce: 1n,
          pollId,
          newVoteWeight: 1n,
          maciAddress: PUBLIC_MACI_ADDRESS,
          privateKey: maciKeypair.privateKey.serialize(),
          signer,
        });
      } catch (error: any) {
        let message: string | undefined;
        if (error.message.includes("0xa47dcd48")) {
          const endDate = poll.endDate;
          message = `The voting period finished at ${unixTimestampToDate(endDate)}. You can no longer submit a vote.`;
        }
        if (error.message.includes("0x256eadc8")) {
          const startDate = poll.startDate;
          message = `The voting period has not begun. It will start at ${unixTimestampToDate(startDate)}`;
        }

        setIsLoading(false);
        setError(message ?? "There was an error submitting your vote");
        addAlert("Failure submitting vote", {
          description: message ?? "Error submitting vote",
          type: "error",
        });
        return;
      }

      setIsLoading(false);
      setError(undefined);
      addAlert("Vote submitted", {
        description: "Your vote is in the ballot. You can submit another vote to override it.",
        type: "success",
      });
    },
    [signer, maciKeypair, pollId, pollStateIndex, hasJoinedPoll, addAlert]
  );

  // check if user is connected
  useEffect(() => {
    setError(undefined);
    if (!isConnected) {
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
        const stateTree = await generateMaciStateTreeWithEndKey({
          maciContractAddress: PUBLIC_MACI_ADDRESS,
          signer,
          userPublicKey: maciKeypair.publicKey,
          startBlock: PUBLIC_MACI_DEPLOYMENT_BLOCK,
        });

        const localInclusionProof = stateTree.signUpTree.generateProof(Number(stateIndex));

        setInclusionProof(localInclusionProof);
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

        setHasJoinedPoll(isJoined);
        setInitialVoiceCredits(Number(voiceCredits));
        setPollStateIndex(pollStateIndex);
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

  const value = useMemo<IMaciContextType>(
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
      deleteKeypair,
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
      deleteKeypair,
      onSignup,
      onJoinPoll,
      onVote,
    ]
  );

  return <MaciContext.Provider value={value as IMaciContextType}>{children}</MaciContext.Provider>;
};
