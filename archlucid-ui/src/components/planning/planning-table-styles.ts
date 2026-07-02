import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const planningTableCls = cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body);

export const planningThTdCls =
  "border border-neutral-200 px-2.5 py-2 text-left align-top dark:border-neutral-700";

export const planningNumericCellCls =
  `${planningThTdCls} text-right tabular-nums`;
