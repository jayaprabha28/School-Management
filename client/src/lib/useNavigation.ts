import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { NavigationResponse } from "./types";

export function useNavigation() {
  return useQuery({
    queryKey: ["navigation"],
    queryFn: async () => (await api.get<NavigationResponse>("/navigation")).data,
    staleTime: 60_000,
  });
}
