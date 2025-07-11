import { PUBLIC_WEB3_MAINNET_ENDPOINT } from "@/constants";
import { formatHexString } from "@/utils/evm";
import { MemberAvatar } from "@aragon/ods";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import classNames from "classnames";
import { createClient, http } from "viem";
import { normalize } from "viem/ens";
import { createConfig, useAccount, useEnsAvatar, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

const config = createConfig({
  chains: [mainnet],
  ssr: true,
  client({ chain }) {
    return createClient({
      chain,
      transport: http(PUBLIC_WEB3_MAINNET_ENDPOINT, { batch: true }),
    });
  },
});

// TODO: update with ODS wallet module - [https://linear.app/aragon/issue/RD-198/create-ods-walletmodule]
const WalletContainer = () => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();

  const { data: ensName } = useEnsName({
    config,
    chainId: mainnet.id,
    address: address,
  });

  const { data: ensAvatar } = useEnsAvatar({
    config,
    name: normalize(ensName!),
    chainId: mainnet.id,
    gatewayUrls: ["https://cloudflare-ipfs.com"],
    query: { enabled: !!ensName },
  });

  if (!isConnected) {
    return (
      <button
        className="cursor:pointer flex h-[48px] min-w-[112px] flex-row items-center justify-center gap-1 rounded-xl border border-primary-400 bg-primary-400 text-base font-semibold leading-tight text-neutral-0 outline-none transition-all hover:border-primary-500 hover:bg-primary-500 hover:shadow-primary-md focus:outline-none focus-visible:ring focus-visible:ring-primary focus-visible:ring-offset active:border-primary-800 active:bg-primary-800 aria-disabled:border-primary-100 aria-disabled:bg-primary-100 aria-disabled:text-primary-300"
        onClick={() => open()}
      >
        Connect
      </button>
    );
  }

  return (
    <button
      className={classNames(
        "shrink-none flex h-12 items-center rounded-full border border-neutral-100 bg-neutral-0 leading-tight text-neutral-500",
        "outline-none focus:outline-none focus-visible:ring focus-visible:ring-primary focus-visible:ring-offset", // focus styles
        { "px-1 md:px-0 md:pl-4 md:pr-1": isConnected },
        { "px-4": !isConnected }
      )}
      onClick={() => open()}
    >
      {isConnected && address && (
        <div className="flex items-center gap-3">
          <span className="hidden md:block">{ensName ?? formatHexString(address)}</span>
          <MemberAvatar src={ensAvatar ?? ""} address={address} alt="Profile picture" size="md" />
        </div>
      )}

      {!isConnected && <button>Connect</button>}
    </button>
  );
};

export default WalletContainer;
