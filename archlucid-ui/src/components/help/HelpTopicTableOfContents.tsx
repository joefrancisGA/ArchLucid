import { cn } from "@/lib/utils";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { cn } from "@/lib/utils";
import { OPERATOR_SHELL_STICKY_TOP_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type HelpTopicTableOfContentsProps = {
  readonly headings: readonly HelpMarkdownHeading[];
};

const MIN_HEADINGS_FOR_TOC = 4;

/** Sticky jump links for long in-app help topics. */
export function HelpTopicTableOfContents(props: HelpTopicTableOfContentsProps): React.JSX.Element | null {
  if (props.headings.length < MIN_HEADINGS_FOR_TOC) {
    return null;
  }

  return (
    <nav aria-label="On this page" className={cn("lg:sticky lg:self-start", OPERATOR_SHELL_STICKY_TOP_CLASS)}>
      <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        On this page
      </p>
      <ul className={cn("m-0 mt-2 max-h-[min(70vh,28rem)] list-none space-y-1 overflow-y-auto p-0", OPERATOR_TYPOGRAPHY.body)}>
        {props.headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block rounded-sm py-0.5 text-neutral-700 underline-offset-2 hover:text-teal-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-neutral-300 dark:hover:text-teal-300 dark:focus-visible:outline-teal-400",
                heading.level === 3 ? "pl-3" : "",
              )}
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
