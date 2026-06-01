import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { cn } from "@/lib/utils";

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
    <nav aria-label="On this page" className="lg:sticky lg:top-20 lg:self-start">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        On this page
      </p>
      <ul className="m-0 mt-2 max-h-[min(70vh,28rem)] list-none space-y-1 overflow-y-auto p-0 text-sm">
        {props.headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block rounded py-0.5 text-neutral-700 underline-offset-2 hover:text-teal-800 hover:underline dark:text-neutral-300 dark:hover:text-teal-300",
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
