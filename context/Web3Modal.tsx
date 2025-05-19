import { http, createConfig } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import {
  PUBLIC_APP_DESCRIPTION,
  PUBLIC_APP_NAME,
  PUBLIC_CHAIN,
  PUBLIC_L2_CHAIN,
  PUBLIC_PROJECT_URL,
  PUBLIC_WALLET_CONNECT_PROJECT_ID,
  PUBLIC_WALLET_ICON,
  PUBLIC_WEB3_ENDPOINT,
  PUBLIC_WEB3_ENDPOINT_L2,
  PUBLIC_WEB3_MAINNET_ENDPOINT,
} from "@/constants";
import { mainnet } from "viem/chains";

// wagmi config
const metadata = {
  name: PUBLIC_APP_NAME,
  description: PUBLIC_APP_DESCRIPTION,
  url: PUBLIC_PROJECT_URL,
  icons: [PUBLIC_WALLET_ICON],
};

export const config = createConfig({
  chains: [PUBLIC_CHAIN, mainnet, PUBLIC_L2_CHAIN],
  syncConnectedChain: true,
  ssr: true,
  transports: {
    [PUBLIC_CHAIN.id]: http(PUBLIC_WEB3_ENDPOINT, { batch: true }),
    [PUBLIC_L2_CHAIN.id]: http(PUBLIC_WEB3_ENDPOINT_L2, { batch: true }),
    [mainnet.id]: http(PUBLIC_WEB3_MAINNET_ENDPOINT, { batch: true }),
  },
  connectors: [
    walletConnect({
      projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
      metadata,
      showQrModal: false,
    }),
    // coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] }),
  ],
});
