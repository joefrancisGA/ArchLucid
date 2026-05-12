import Link from "next/link";

type RunDetailBreadcrumbProps = {
  readonly headline: string;
};

export function RunDetailBreadcrumb(props: RunDetailBreadcrumbProps) {
  const { headline } = props;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-600 dark:text-neutral-400">
      <Link className="text-teal-800 underline dark:text-teal-300" href="/">
        Home
      </Link>
      {" · "}
      <Link className="text-teal-800 underline dark:text-teal-300" href="/reviews?projectId=default">
        Reviews
      </Link>
      {" · "}
      <span className="font-medium text-neutral-800 dark:text-neutral-200" aria-current="page">
        {headline}
      </span>
    </nav>
  );
}
