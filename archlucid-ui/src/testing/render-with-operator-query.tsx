import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";

function OperatorQueryTestWrapper({ children }: { children: ReactNode }) {
  return <OperatorQueryProvider>{children}</OperatorQueryProvider>;
}

export function renderWithOperatorQuery(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: OperatorQueryTestWrapper, ...options });
}
