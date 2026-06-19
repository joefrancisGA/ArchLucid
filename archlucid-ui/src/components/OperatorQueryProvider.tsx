"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { getOperatorQueryClient } from "@/lib/query/operator-query-client";

type OperatorQueryProviderProps = {
  readonly children: ReactNode;
};

/** TanStack Query root for operator shell shared status reads. */
export function OperatorQueryProvider({ children }: OperatorQueryProviderProps) {
  const [queryClient] = useState(() => getOperatorQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
