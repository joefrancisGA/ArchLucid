import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export type WizardStepPanelProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/**
 * Card shell for a single wizard step (header + body).
 */
export function WizardStepPanel({ title, description, children }: WizardStepPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-lg font-semibold leading-none tracking-tight text-neutral-900 dark:text-neutral-50">
          {title}
        </h2>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
