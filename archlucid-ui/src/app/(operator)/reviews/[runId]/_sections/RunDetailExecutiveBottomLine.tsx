import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunExplanationSummary } from "@/types/explanation";

type RunDetailExecutiveBottomLineProps = {
  readonly explanationSummary: RunExplanationSummary | null;
};

export function RunDetailExecutiveBottomLine(props: RunDetailExecutiveBottomLineProps): ReactElement | null {
  const { explanationSummary } = props;

  if (!explanationSummary || !explanationSummary.themeSummaries || explanationSummary.themeSummaries.length === 0) {
    return null;
  }

  const themes = explanationSummary.themeSummaries.slice(0, 3);

  return (
    <Card className="border-l-4 border-l-teal-600 dark:border-l-teal-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Bottom-Line Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          {themes.map((theme) => (
            <li key={theme} className="leading-relaxed">
              {theme}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
