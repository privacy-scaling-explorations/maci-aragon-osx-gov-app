import { useContext } from "react";
import { type ICoordinatorContextType } from "../contexts/types";
import { CoordinatorContext } from "../contexts/CoordinatorContext";

export const useCoordinator = (): ICoordinatorContextType => {
  const coordinatorContext = useContext(CoordinatorContext);

  if (!coordinatorContext) {
    throw new Error("Should use context inside provider.");
  }

  return coordinatorContext;
};
