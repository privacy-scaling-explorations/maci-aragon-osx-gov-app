import { PUBLIC_CHAIN } from "@/constants";
import { useMemo } from "react";
import { useSwitchChain } from "wagmi";
import { useAccount } from "wagmi";

export function useSwitchToChain() {
  const { switchChain } = useSwitchChain();
  const { chain } = useAccount();

  const isCorrectChain = useMemo(() => {
    return chain?.id === PUBLIC_CHAIN.id;
  }, [chain?.id]);

  const switchToChain = async () => {
    if (isCorrectChain) return;

    try {
      switchChain({ chainId: PUBLIC_CHAIN.id });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to switch chain:", error);
    }
  };
  return { switchToChain, isCorrectChain };
}
