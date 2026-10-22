import { cn } from "@/lib/utils";
import { InAppHelpLink, type InAppHelpLinkProps } from "@/components/InAppHelpLink";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Text guidance link for operator Home — avoids icon `?` clusters beside section titles. */
export function OperatorHomeGuidanceLink(props: InAppHelpLinkProps): React.JSX.Element {
  const { className, ...rest } = props;

  return (
    <InAppHelpLink
      {...rest}
      variant="text"
      className={cn(OPERATOR_TYPOGRAPHY.helper, "font-medium", className)}
    />
  );
}
