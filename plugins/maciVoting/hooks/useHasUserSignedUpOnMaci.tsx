import { hasUserSignedUp } from "@maci-protocol/sdk";
import { PUB_CHAIN, PUB_MACI_ADDRESS } from "@/constants";
import { createWalletClient, custom } from "viem";

export function useHasUserSignedUpOnMaci() {
  /*
  const [account] = await window.ethereum?.request({ method: "eth_requestAccounts" });
  if (!account) {
    throw new Error("Could not retrieve account");
  }
  const walletClient = createWalletClient({
    account,
    chain: PUB_CHAIN,
    transport: custom(window.ethereum),
  });


  const hasSignedUp = await hasUserSignedUp({
    maciAddress: PUB_MACI_ADDRESS,
    signer: walletClient,
  });


  1. check if userMaciPublicKey is saved in localStorage
  1.1. if not, create a new public key
  1.2. save it in localStorage
  1.3. sign up user in MACI

  2. check if user is signed up in MACI
  2.1. if not, sign up user in MACI

  /**
   * Create public key and sign up user in MACI
   * function so that when user clicks a button, it gets executed
   */

  return false;
}
