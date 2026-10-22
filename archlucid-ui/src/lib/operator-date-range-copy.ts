import { cn } from "@/lib/utils";

/** Buyer-visible operator date/datetime range filter labels (TB-2012). */
export const OPERATOR_DATE_RANGE_START_LABEL = "Start date";

export const OPERATOR_DATE_RANGE_END_LABEL = "End date";

/** Short suffix when `datetime-local` maps local wall time to UTC storage. */
export const OPERATOR_DATE_RANGE_LOCAL_TIME_SUFFIX = "(local)";

export const OPERATOR_DATE_RANGE_EXPORT_WINDOW_INCOMPLETE_MESSAGE =
  "Set Start date and End date to enable export";

/** Content-sized native date/datetime inputs — do not stretch across grid columns (TB-2012). */
export const OPERATOR_DATE_RANGE_INPUT_CLASSNAME = cn(
  "max-w-[12rem] w-auto rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
);
