import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { PUB_CHAIN, PUB_TOKEN_ADDRESS } from "@/constants";

export function useVotingToken() {
  const {
    data: tokenSupply,
    isError: isError1,
    isLoading: isLoading1,
  } = useReadContract({
    chainId: PUB_CHAIN.id,
    address: PUB_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "totalSupply",
  });

  const {
    data: tokenSymbol,
    isError: isError2,
    isLoading: isLoading2,
  } = useReadContract({
    chainId: PUB_CHAIN.id,
    address: PUB_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "symbol",
  });

  return {
    address: PUB_TOKEN_ADDRESS,
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
    chainId: PUB_CHAIN.id,
    address: PUB_TOKEN_ADDRESS,
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
