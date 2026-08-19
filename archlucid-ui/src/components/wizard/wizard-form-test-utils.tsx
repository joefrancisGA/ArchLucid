import { zodResolver } from "@hookform/resolvers/zod";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { buildDefaultWizardValues, wizardFormSchema, type WizardFormValues } from "@/lib/wizard-schema";

type HarnessProps = {
  children: ReactNode;
  values?: Partial<WizardFormValues>;
};

/**
 * Wraps wizard step components with the same FormProvider + zod resolver shape as production.
 */
export function WizardFormTestHarness({ children, values }: HarnessProps) {
  const defaultValues: WizardFormValues = wizardFormSchema.parse({
    ...buildDefaultWizardValues(),
    ...values,
  });

  const methods = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

export function renderWithWizardForm(ui: ReactElement, values?: Partial<WizardFormValues>) {
  return render(<WizardFormTestHarness values={values}>{ui}</WizardFormTestHarness>);
}
