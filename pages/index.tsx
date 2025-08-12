import { Button, IllustrationHuman } from "@aragon/ods";
import { type ReactNode } from "react";
import { useAccount } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Else, If, Then } from "@/components/if";
import { PUBLIC_DISCORD_URL, PUBLIC_TWITTER_URL } from "@/constants";

export default function Home() {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();

  return (
    <main className="w-screen max-w-full flex-col">
      <Card>
        <h1 className="text-2xl font-[700] text-neutral-800">Welcome to the Aragon - MACI Plugin</h1>
        <p className="text-md text-neutral-400">
          This user interface was built to showcase the MACI private voting plugin integrated into Aragon OSx. Remember
          that this demo is a work in progress.
        </p>
        <div className="">
          <IllustrationHuman className="mx-auto mb-10 max-w-96" body="BLOCKS" expression="SMILE_WINK" hairs="CURLY" />
          <div className="flex justify-center">
            <If condition={isConnected}>
              <Then>
                <div className="flex flex-col items-center gap-1">
                  <Button className="mb-2" variant="primary" href="https://devs.aragon.org/docs/osx/" target="_blank">
                    Learn more about OSx
                  </Button>
                  <Button
                    className="mb-2"
                    variant="primary"
                    href="https://github.com/privacy-scaling-explorations/maci"
                    target="_blank"
                  >
                    Learn more about MACI
                  </Button>
                  <Button
                    className="mb-2"
                    variant="secondary"
                    href="https://github.com/privacy-scaling-explorations/maci-voting-plugin-aragon"
                    target="_blank"
                  >
                    Aragon - MACI Plugin
                  </Button>
                  <Button
                    className="mb-2"
                    variant="secondary"
                    href="https://github.com/privacy-scaling-explorations/maci-aragon-osx-gov-app"
                    target="_blank"
                  >
                    Aragon - MACI Frontend
                  </Button>

                  <div className="mt-4 flex gap-4">
                    <a
                      href={PUBLIC_DISCORD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 transition-colors hover:text-primary-500"
                      aria-label="Discord"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
                      </svg>
                    </a>
                    <a
                      href={PUBLIC_TWITTER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 transition-colors hover:text-primary-500"
                      aria-label="Twitter"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </Then>
              <Else>
                <Button size="md" variant="primary" onClick={() => open()}>
                  <span>Connect wallet</span>
                </Button>
              </Else>
            </If>
          </div>
        </div>
      </Card>
    </main>
  );
}

// This should be encapsulated as soon as ODS exports this widget
const Card = function ({ children }: { children: ReactNode }) {
  return (
    <div
      className="xs:px-10 mb-6 box-border flex
    w-full flex-col space-y-6
    rounded-xl border border-neutral-100
    bg-neutral-0 px-4 py-5 focus:outline-none focus:ring focus:ring-primary
    md:px-6 lg:px-7"
    >
      {children}
    </div>
  );
};
