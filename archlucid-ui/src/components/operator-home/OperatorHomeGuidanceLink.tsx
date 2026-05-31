import { InAppHelpLink, type InAppHelpLinkProps } from "@/components/InAppHelpLink";
import { cn } from "@/lib/utils";

/** Text guidance link for operator Home — avoids icon `?` clusters beside section titles. */
export function OperatorHomeGuidanceLink(props: InAppHelpLinkProps): React.JSX.Element {
  const { className, ...rest } = props;

  return (
    <InAppHelpLink
      {...rest}
      variant="text"
      className={cn("text-xs font-medium", className)}
    />
  );
}
