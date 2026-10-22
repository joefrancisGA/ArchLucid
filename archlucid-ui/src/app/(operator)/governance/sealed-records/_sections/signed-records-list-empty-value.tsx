import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { SIGNED_RECORDS_LIST_VERSION_UNKNOWN } from "./signed-records-list-copy";

export type SignedRecordsListEmptyValueProps = {
  readonly fieldLabel: string;
};

/** Visually hidden "unknown" for table placeholders — screen readers get field context, not a bare dash. */
export function SignedRecordsListEmptyValue(props: SignedRecordsListEmptyValueProps): React.JSX.Element {
  return (
    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
      <span aria-hidden="true">{SIGNED_RECORDS_LIST_VERSION_UNKNOWN}</span>
      <span className="sr-only">{`${props.fieldLabel} not available`}</span>
    </span>
  );
}
