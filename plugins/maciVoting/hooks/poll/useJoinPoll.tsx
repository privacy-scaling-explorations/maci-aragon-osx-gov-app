import { PUBLIC_MACI_ADDRESS, PUBLIC_MACI_DEPLOYMENT_BLOCK } from "@/constants";
import { generateMaciStateTreeWithEndKey, getJoinedUserData, joinPoll } from "@maci-protocol/sdk/browser";
import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA } from "../../contexts/MaciContext";
import { clientToSigner, useEthersSigner } from "../useEthersSigner";
import { useMaci } from "../useMaci";
import { type IJoinPollData } from "../../contexts/types";

export const useJoinPoll = (pollId?: bigint) => {
  const signer = useEthersSigner();
  const publicClient = usePublicClient();
  const { maciKeypair, isRegistered, stateIndex, artifacts } = useMaci();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [hasJoinedPoll, setHasJoinedPoll] = useState(false);
  const [joinedPollData, setJoinedPollData] = useState<IJoinPollData | undefined>();

  // check if the user has joined the poll
  useEffect(() => {
    (async () => {
      if (!pollId || !publicClient || !maciKeypair || !isRegistered || !artifacts) {
        return;
      }

      // TODO: use useQuery for this

      const publicSigner = clientToSigner(publicClient);

      const joinedUser = await getJoinedUserData({
        maciAddress: PUBLIC_MACI_ADDRESS,
        pollPublicKey: maciKeypair.publicKey.serialize(),
        signer: publicSigner,
        startBlock: PUBLIC_MACI_DEPLOYMENT_BLOCK,
        pollId,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.log("Error checking if user has joined poll", error);
        return;
      });

      console.log("joinedUser", joinedUser);
      console.log("pollId", pollId);

      if (joinedUser && joinedUser.isJoined) {
        setHasJoinedPoll(true);
        setJoinedPollData({
          pollStateIndex: joinedUser.pollStateIndex ?? "",
          voiceCredits: joinedUser.voiceCredits ?? "0",
          // these two attributes are returned only when the user joins the poll
          nullifier: "",
          hash: "",
        });
      }
    })();
  }, [artifacts, isRegistered, maciKeypair, pollId, publicClient]);

  const joinPollFunction = useCallback(async () => {
    if (!pollId || !signer || !maciKeypair || !isRegistered || !artifacts) {
      setHasJoinedPoll(false);
      return;
    }

    const stateTree = await generateMaciStateTreeWithEndKey({
      maciContractAddress: PUBLIC_MACI_ADDRESS,
      signer,
      userPublicKey: maciKeypair.publicKey,
      startBlock: PUBLIC_MACI_DEPLOYMENT_BLOCK,
    });

    const inclusionProof = stateTree.signUpTree.generateProof(Number(stateIndex));

    const joinedData = await joinPoll({
      maciAddress: PUBLIC_MACI_ADDRESS,
      privateKey: maciKeypair.privateKey.serialize(),
      signer,
      pollId,
      inclusionProof: inclusionProof,
      pollJoiningZkey: artifacts.zKey as unknown as string,
      pollWasm: artifacts.wasm as unknown as string,
      sgDataArg: DEFAULT_SG_DATA,
      ivcpDataArg: DEFAULT_IVCP_DATA,
      blocksPerBatch: 1000,
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

    if (!joinedData) {
      setHasJoinedPoll(false);
      return;
    }

    setHasJoinedPoll(true);
    setJoinedPollData(joinedData);
  }, [artifacts, isRegistered, maciKeypair, pollId, signer, stateIndex]);

  return {
    isLoading,
    error,
    hasJoinedPoll,
    joinedPollData,
    joinPollFunction,
  };
};
