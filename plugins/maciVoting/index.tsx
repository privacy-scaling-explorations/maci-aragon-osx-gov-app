import { NotFound } from "@/components/not-found";
import { useSwitchToChain } from "@/hooks/useSwitchChain";
import { useUrl } from "@/hooks/useUrl";
import { useEffect, type ReactNode } from "react";
import { MaciProvider } from "./contexts/MaciContext";
import ProposalCreate from "./pages/new";
import ProposalDetail from "./pages/proposal";
import ProposalList from "./pages/proposal-list";
export default function PluginPage() {
  const { isCorrectChain, switchToChain } = useSwitchToChain();
  // Select the inner pages to display depending on the URL hash
  const { hash } = useUrl();
  let content: ReactNode;

  useEffect(() => {
    if (!isCorrectChain) {
      switchToChain();
    }
  }, [isCorrectChain, switchToChain]);

  if (!hash || hash === "#/") content = <ProposalList />;
  else if (hash === "#/new") content = <ProposalCreate />;
  else if (hash.startsWith("#/proposals/")) {
    const id = hash.replace("#/proposals/", "");

    content = <ProposalDetail id={id} />;
  } else {
    // Default not found page
    content = <NotFound />;
  }
  return <MaciProvider>{content}</MaciProvider>;
}
