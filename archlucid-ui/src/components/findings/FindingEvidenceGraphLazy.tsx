"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { GraphStaticFallback } from "@/components/GraphStaticFallback";

import type { FindingEvidenceGraphProps } from "./FindingEvidenceGraph";

export const FindingEvidenceGraph: ComponentType<FindingEvidenceGraphProps> = dynamic(
  () => import("./FindingEvidenceGraph").then((module) => module.FindingEvidenceGraph),
  {
    ssr: false,
    loading: () => <GraphStaticFallback />,
  },
);
