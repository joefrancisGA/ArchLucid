import { cn } from "@/lib/utils";
import { OPERATOR_DOCUMENT_ARTICLE_BODY, OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

export type DocumentTocItem = {
  id: string;
  label: string;
};

export type DocumentLayoutProps = {
  children: React.ReactNode;
  /** When length ≥ 3, a sticky TOC appears from the `xl` breakpoint. */
  tocItems?: DocumentTocItem[];
  className?: string;
};

const articleBodyClass = cn(
  "min-w-0 max-w-3xl flex-1 space-y-6 text-neutral-800 dark:text-neutral-200",
  "print:max-w-none print:text-black",
  OPERATOR_DOCUMENT_ARTICLE_BODY,
);

/**
 * GitBook-like reading column: comfortable measure, relaxed body type, optional sticky TOC (xl+), print-friendly width.
 * Pure layout — no data fetching.
 */
export function DocumentLayout({ children, tocItems, className }: DocumentLayoutProps) {
  const showToc = tocItems !== undefined && tocItems.length >= 3;

  return (
    <div
      className={cn(
        "w-full print:max-w-none",
        showToc && "flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10",
        className,
      )}
      data-testid="document-layout"
    >
      <article className={articleBodyClass} data-testid="document-layout-article">
        {children}
      </article>
      {showToc ? (
        <nav
          className="hidden w-52 shrink-0 xl:sticky xl:top-24 xl:block xl:self-start print:hidden"
          aria-label="On this page"
          data-testid="document-layout-toc"
        >
          <p className={cn("m-0 mb-2 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
            On this page
          </p>
          <ul className={cn("m-0 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-neutral-600 underline decoration-neutral-300 decoration-1 underline-offset-2 hover:text-teal-800 dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-teal-300"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
