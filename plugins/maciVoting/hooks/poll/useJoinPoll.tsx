import { PUBLIC_MACI_ADDRESS, PUBLIC_MACI_DEPLOYMENT_BLOCK } from "@/constants";
import { generateMaciStateTreeWithEndKey, getJoinedUserData, joinPoll } from "@maci-protocol/sdk/browser";
import { useCallback, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA } from "../../contexts/MaciContext";
import { clientToSigner, useEthersSigner } from "../useEthersSigner";
import { useMaci } from "../useMaci";
import { type IJoinPollData } from "../../contexts/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useJoinPoll = (pollId?: bigint) => {
  const signer = useEthersSigner();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { maciKeypair, isRegistered, stateIndex, artifacts } = useMaci();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // Keep track of newly joined poll data that will be returned when joining a poll
  const [newlyJoinedPollData, setNewlyJoinedPollData] = useState<IJoinPollData | undefined>();

  // Query key for consistent cache access
  const joinedUserQueryKey = useMemo(
    () => ["joinedUserData", pollId?.toString(), maciKeypair?.publicKey.serialize()],
    [pollId, maciKeypair]
  );

  // check if the user has joined the poll using useQuery
  const { data: joinedPollData, isLoading: isLoadingQuery } = useQuery({
    queryKey: joinedUserQueryKey,
    queryFn: async () => {
      if (!pollId || !publicClient || !maciKeypair || !isRegistered || !artifacts) {
        return null;
      }

      setIsLoading(true);
      try {
        const publicSigner = clientToSigner(publicClient);

        const joinedUser = await getJoinedUserData({
          maciAddress: PUBLIC_MACI_ADDRESS,
          pollPublicKey: maciKeypair.publicKey.serialize(),
          signer: publicSigner,
          startBlock: PUBLIC_MACI_DEPLOYMENT_BLOCK,
          pollId,
        });

        if (joinedUser && joinedUser.isJoined) {
          return {
            pollStateIndex: joinedUser.pollStateIndex ?? "",
            voiceCredits: joinedUser.voiceCredits ?? "0",
            // these two attributes are returned only when the user joins the poll
            nullifier: "",
            hash: "",
          };
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error checking if user has joined poll", error);
      }

      setIsLoading(false);
      return null;
    },
    enabled: Boolean(pollId && publicClient && maciKeypair && isRegistered && artifacts),
    staleTime: Infinity, // Cache forever as mentioned by user
    gcTime: Infinity, // Keep in cache forever
  });

  const joinPollFunction = useCallback(async () => {
    if (!pollId || !signer || !maciKeypair || !isRegistered || !artifacts) {
      return;
    }

    if (joinedPollData) {
      setNewlyJoinedPollData(joinedPollData);
    }

    setIsLoading(true);
    setError(undefined);

    try {
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
      });

      if (joinedData) {
        setNewlyJoinedPollData(joinedData);
        // After successfully joining, manually invalidate the query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: joinedUserQueryKey });
      }
    } catch (error: any) {
      if (error.message?.includes("0xa3281672")) {
        // 0xa3281672 -> signature of BalanceTooLow()
        setError(`Address balance is too low to join the poll`);
      } else {
        // eslint-disable-next-line no-console
        console.error("Error joining poll", error);
        setError("Error joining poll");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    pollId,
    signer,
    maciKeypair,
    isRegistered,
    artifacts,
    joinedPollData,
    stateIndex,
    queryClient,
    joinedUserQueryKey,
  ]);

  // Use the query data or the newly joined data if available
  const effectiveJoinedPollData = newlyJoinedPollData ?? joinedPollData;
  const effectiveHasJoinedPoll = Boolean(effectiveJoinedPollData);

  return {
    isLoading: isLoading || isLoadingQuery,
    error,
    hasJoinedPoll: effectiveHasJoinedPoll,
    joinedPollData: effectiveJoinedPollData,
    joinPollFunction,
  };
};
