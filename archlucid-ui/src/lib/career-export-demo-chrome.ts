import {
  demoVsLiveChromeForFlags,
  type DemoVsLiveChromeFlags,
} from "@/lib/demo-vs-live-chrome";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { StructuralExecutionModeWire, type StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export type CareerExportDemoChromeInput = DemoVsLiveChromeFlags & {
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
};

export function resolveCareerExportDemoChromeFlags(
  input: CareerExportDemoChromeInput,
): DemoVsLiveChromeFlags {
  const isSimulator =
    input.isSimulator === true
    || input.structuralExecutionMode === StructuralExecutionModeWire.Simulator
    || input.structuralExecutionMode === 0;

  return {
    usedStaticDemoRun: input.usedStaticDemoRun === true || input.isSample === true,
    isSimulator,
    isStaticDemoEnv: input.isStaticDemoEnv ?? isBuyerSafeDemoMarketingChromeEnv(),
  };
}

export function formatCareerExportDemoHonestyMarkdown(input: CareerExportDemoChromeInput): string {
  const copy = demoVsLiveChromeForFlags(resolveCareerExportDemoChromeFlags(input));

  if (copy === null) {
    return "";
  }

  return `> **${copy.bannerTitle}:** ${copy.bannerBody}`;
}
