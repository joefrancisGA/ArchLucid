import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_READER_SCOPE_WORKBENCH_HREF,
  SECURENOW_READER_SCOPE_WORKBENCH_LINE,
  SECURENOW_READER_SCOPE_WORKBENCH_LINK_LABEL,
} from "@/lib/product-line/securenow-reader-scope-workbench-copy";
import { cn } from "@/lib/utils";

export function SecureNowReaderScopeWorkbenchStrip(props: {
  readonly testId?: string;
}): React.JSX.Element {
  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId ?? "securenow-reader-scope-workbench-strip"}
    >
      {SECURENOW_READER_SCOPE_WORKBENCH_LINE}{" "}
      <Link className={OPERATOR_LINK.inline} href={SECURENOW_READER_SCOPE_WORKBENCH_HREF}>
        {SECURENOW_READER_SCOPE_WORKBENCH_LINK_LABEL}
      </Link>
    </p>
  );
}
