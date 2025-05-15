import { NotFound } from "@/components/not-found";
import ProposalCreate from "./pages/new";
import ProposalList from "./pages/proposal-list";
import ProposalDetail from "./pages/proposal";
import { useUrl } from "@/hooks/useUrl";
import type { ReactNode } from "react";
import { MaciProvider } from "./contexts/MaciContext";

export default function PluginPage() {
  // Select the inner pages to display depending on the URL hash
  const { hash } = useUrl();
  let content: ReactNode;

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
