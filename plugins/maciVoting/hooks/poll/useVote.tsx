import { PUBLIC_MACI_ADDRESS } from "@/constants";
import { publish } from "@maci-protocol/sdk/browser";
import { useCallback } from "react";
import { VoteOption } from "../../utils/types";
import { useEthersSigner } from "../useEthersSigner";
import { useMaci } from "../useMaci";

export const useVote = () => {
  const signer = useEthersSigner();
  const { maciKeypair, isRegistered } = useMaci();

  const voteFunction = useCallback(
    async (pollId: bigint, pollStateIndex: string, voiceCredits: string, option: VoteOption) => {
      if (!pollId || !signer || !maciKeypair || !isRegistered) {
        throw new Error("Poll ID and vote option are required to vote");
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

      const publishData = await publish({
        publicKey: maciKeypair.publicKey.serialize(),
        stateIndex: BigInt(pollStateIndex),
        voteOptionIndex,
        nonce: 1n,
        pollId,
        newVoteWeight: BigInt(voiceCredits),
        maciAddress: PUBLIC_MACI_ADDRESS,
        privateKey: maciKeypair.privateKey.serialize(),
        signer,
      }).catch((error: Error) => {
        return error;
      });

      return publishData;
    },
    [isRegistered, maciKeypair, signer]
  );

  return {
    voteFunction,
  };
};
