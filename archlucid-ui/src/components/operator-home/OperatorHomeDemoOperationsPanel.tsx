"use client";

import dynamic from "next/dynamic";

const OperatorHomeDemoOperationsSection = dynamic(
  () =>
    import("@/components/operator-home/OperatorHomeDemoOperationsSection").then(
      (module) => module.OperatorHomeDemoOperationsSection,
    ),
  { loading: () => null, ssr: false },
);

/** Deferred internal demo operations rail — below the fold on operator home. */
export function OperatorHomeDemoOperationsPanel(): React.JSX.Element | null {
  return <OperatorHomeDemoOperationsSection />;
}
