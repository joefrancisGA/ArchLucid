import { render, type RenderOptions } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { createOperatorQueryClient } from "@/lib/query/operator-query-client";

export function renderDiagramsWorkbenchTest(element: ReactElement, options?: RenderOptions) {
  const client = createOperatorQueryClient();
  const Outer = options?.wrapper;
  function Wrapper({ children }: { readonly children: ReactNode }) {
    const content = <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return Outer == null ? content : <Outer>{content}</Outer>;
  }

  return render(element, { ...options, wrapper: Wrapper });
}
