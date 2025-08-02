import { type Config, useConnectorClient, usePublicClient } from "wagmi";

import { BrowserProvider, JsonRpcSigner } from "ethers";
import { zeroAddress, type Account, type Chain, type Client, type PublicClient, type Transport } from "viem";
import { useMemo } from "react";

export function clientToSigner(client: Client<Transport, Chain, Account> | PublicClient<Transport, Chain>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account ? account.address : zeroAddress);
  return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: connectorClient } = useConnectorClient<Config>({ chainId });
  const publicClient = usePublicClient();

  const connectorSigner = useMemo(() => {
    if (!connectorClient) return undefined;
    return clientToSigner(connectorClient);
  }, [connectorClient]);

  const publicSigner = useMemo(() => {
    if (!publicClient) return undefined;
    return clientToSigner(publicClient);
  }, [publicClient]);

  // in case no wallet is connected, we return a public signer with the zero address
  return useMemo(() => connectorSigner ?? publicSigner, [connectorSigner, publicSigner]);
}
