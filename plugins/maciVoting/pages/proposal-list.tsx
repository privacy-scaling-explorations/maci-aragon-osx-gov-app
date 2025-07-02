import { useAccount, useBlockNumber, useReadContract } from "wagmi";
import { type ReactNode, useEffect } from "react";
import ProposalCard from "@/plugins/maciVoting/components/proposal";
import {
  Button,
  DataList,
  IconType,
  IllustrationHuman,
  ProposalDataListItemSkeleton,
  type DataListState,
} from "@aragon/ods";
import { useCanCreateProposal } from "@/plugins/maciVoting/hooks/useCanCreateProposal";
import Link from "next/link";
import { Else, If, Then } from "@/components/if";
import { PUBLIC_MACI_VOTING_PLUGIN_ADDRESS, PUBLIC_CHAIN } from "@/constants";

import MaciCard from "../components/MaciCard";
import { MaciVotingAbi } from "../artifacts/MaciVoting.sol";

const DEFAULT_PAGE_SIZE = 6;

export default function Proposals() {
  const { isConnected } = useAccount();
  const canCreate = useCanCreateProposal();

  const { data: blockNumber } = useBlockNumber({ watch: true });

  const {
    data: proposalCountResponse,
    error: isError,
    isLoading,
    isFetching: isFetchingNextPage,
    refetch,
  } = useReadContract({
    address: PUBLIC_MACI_VOTING_PLUGIN_ADDRESS,
    abi: MaciVotingAbi,
    functionName: "proposalCount",
    chainId: PUBLIC_CHAIN.id,
    query: {
      refetchOnWindowFocus: true,
    },
  });

  const proposalCount = Number(proposalCountResponse);

  useEffect(() => {
    refetch();
  }, [blockNumber, refetch]);

  const entityLabel = proposalCount === 1 ? "Proposal" : "Proposals";

  let dataListState: DataListState = "idle";
  if (isLoading && !proposalCount) {
    dataListState = "initialLoading";
  } else if (isError) {
    dataListState = "error";
  } else if (isFetchingNextPage) {
    dataListState = "fetchingNextPage";
  } else {
    dataListState = "loading";
  }

  const emptyFilteredState = {
    heading: "No proposals found",
    description: "Your applied filters are not matching with any results. Reset and search with other filters!",
    secondaryButton: {
      label: "Reset all filters",
      iconLeft: IconType.RELOAD,
    },
  };

  const errorState = {
    heading: "Error loading proposals",
    description: "There was an error loading the proposals. Try again!",
    secondaryButton: {
      label: "Reload proposals",
      iconLeft: IconType.RELOAD,
      onClick: () => refetch(),
    },
  };

  return (
    <MainSection>
      <SectionView>
        <div className="flex w-full max-w-screen-xl justify-between gap-x-10">
          <h1 className="justify-self-start align-middle text-3xl font-semibold">Proposals</h1>
          <div className="justify-self-end">
            <If condition={isConnected && canCreate}>
              <Link href="#/new">
                <Button iconLeft={IconType.PLUS} size="md" variant="primary">
                  Submit Proposal
                </Button>
              </Link>
            </If>
          </div>
        </div>

        <div
          className="mx-auto flex w-full max-w-screen-xl flex-col justify-between
        gap-5 md:flex-row md:pb-20 "
        >
          <div className="flex w-full grow flex-col gap-x-12 gap-y-6 md:w-auto md:flex-row">
            <If condition={proposalCount}>
              <Then>
                <DataList.Root
                  entityLabel={entityLabel}
                  itemsCount={proposalCount}
                  pageSize={DEFAULT_PAGE_SIZE}
                  state={dataListState}
                  // onLoadMore={fetchNextPage}
                >
                  <DataList.Container
                    SkeletonElement={ProposalDataListItemSkeleton}
                    errorState={errorState}
                    emptyFilteredState={emptyFilteredState}
                  >
                    {proposalCount &&
                      Array.from(Array(proposalCount)?.keys())
                        .reverse()
                        ?.map((proposalIndex) => (
                          // TODO: update with router agnostic ODS DataListItem
                          <ProposalCard key={proposalIndex} proposalId={BigInt(proposalIndex)} />
                        ))}
                  </DataList.Container>
                  <DataList.Pagination />
                </DataList.Root>
              </Then>
              <Else>
                <div className="w-full">
                  <p className="text-md text-neutral-400">No proposals have been created yet.</p>
                  <IllustrationHuman
                    className="mx-auto mb-10 max-w-72"
                    body="BLOCKS"
                    expression="SMILE_WINK"
                    hairs="CURLY"
                  />
                  <If condition={isConnected && canCreate}>
                    <div className="flex justify-center">
                      <Link href="#/new">
                        <Button iconLeft={IconType.PLUS} size="md" variant="primary">
                          Submit Proposal
                        </Button>
                      </Link>
                    </div>
                  </If>
                </div>
              </Else>
            </If>
          </div>
          <div className="flex w-[33%] flex-col gap-y-3">
            <MaciCard />
          </div>
        </div>
      </SectionView>
    </MainSection>
  );
}

function MainSection({ children }: { children: ReactNode }) {
  return <main className="w-full p-4 md:px-6 md:pb-20 xl:pt-10">{children}</main>;
}

function SectionView({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-y-6 md:px-6">{children}</div>;
}
