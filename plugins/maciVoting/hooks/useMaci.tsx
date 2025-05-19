import { useContext } from "react";
import { type IMaciContextType } from "../contexts/types";
import { MaciContext } from "../contexts/MaciContext";

export const useMaci = (): IMaciContextType => {
  const maciContext = useContext(MaciContext);

  if (!maciContext) {
    throw new Error("Should use context inside provider.");
  }

  return maciContext;
};
