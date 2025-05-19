import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { PUBLIC_CHAIN, PUBLIC_TOKEN_ADDRESS } from "@/constants";

export function useVotingToken() {
  const {
    data: tokenSupply,
    isError: isError1,
    isLoading: isLoading1,
  } = useReadContract({
    chainId: PUBLIC_CHAIN.id,
    address: PUBLIC_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "totalSupply",
  });

  const {
    data: tokenSymbol,
    isError: isError2,
    isLoading: isLoading2,
  } = useReadContract({
    chainId: PUBLIC_CHAIN.id,
    address: PUBLIC_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "symbol",
  });

  return {
    address: PUBLIC_TOKEN_ADDRESS,
    tokenSupply,
    symbol: tokenSymbol,
    status: {
      isLoading: isLoading1 || isLoading2,
      isError: isError1 || isError2,
    },
  };
}

export function useVotingTokenBalance() {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    error,
    isError,
    isLoading,
    queryKey,
  } = useReadContract({
    chainId: PUBLIC_CHAIN.id,
    address: PUBLIC_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x"],
    query: { enabled: isConnected && !!address },
  });

  return {
    balance,
    status: {
      error,
      isLoading,
      isError,
    },
    queryKey,
  };
}
