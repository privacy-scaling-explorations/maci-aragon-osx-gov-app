import { type Address } from "viem";
import { useState, useEffect } from "react";
import { useBalance, useAccount, useReadContracts } from "wagmi";
import { PUBLIC_CHAIN, PUBLIC_MACI_VOTING_PLUGIN_ADDRESS } from "@/constants";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";

export function useCanCreateProposal() {
  const { address } = useAccount();
  const [minProposerVotingPower, setMinProposerVotingPower] = useState<bigint | undefined>();
  const [votingToken, setVotingToken] = useState<Address>();
  const { data: balance } = useBalance({
    address,
    token: votingToken,
    chainId: PUBLIC_CHAIN.id,
  });

  const { data: contractReads } = useReadContracts({
    contracts: [
      {
        chainId: PUBLIC_CHAIN.id,
        address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
        abi: MaciVotingAbi,
        functionName: "minProposerVotingPower",
      },
      {
        chainId: PUBLIC_CHAIN.id,
        address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
        abi: MaciVotingAbi,
        functionName: "getVotingToken",
      },
    ],
  });

  useEffect(() => {
    if (!contractReads?.length || contractReads?.length < 2) return;

    setMinProposerVotingPower(contractReads[0].result as bigint);
    setVotingToken(contractReads[1].result as Address);
  }, [contractReads]);

  if (!address) return false;
  else if (!minProposerVotingPower) return true;
  else if (!balance) return false;
  else if (balance?.value >= minProposerVotingPower) return true;

  return false;
}
