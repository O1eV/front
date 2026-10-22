import { useOutletContext } from "react-router-dom";
import type { useDashboard } from "./useDashboard";

export function useDashboardContext() {
  return useOutletContext<ReturnType<typeof useDashboard>>();
}
