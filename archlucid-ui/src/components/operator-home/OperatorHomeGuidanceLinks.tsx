import { cn } from "@/lib/utils";

type OperatorHomeGuidanceLinksProps = {
  children: React.ReactNode;
  className?: string;
};

/** Wraps one or more {@link OperatorHomeGuidanceLink} rows under a section body or header. */
export function OperatorHomeGuidanceLinks(props: OperatorHomeGuidanceLinksProps): React.JSX.Element {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", props.className)}>
      {props.children}
    </div>
  );
}
