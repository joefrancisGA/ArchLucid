"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const DEFAULT_COLLAPSE_DEPTH = 3;

type JsonNodeProps = {
  value: unknown;
  depth: number;
  propertyKey?: string;
};

/**
 * Renders JSON as a navigable, collapsible tree. Depth ≥ DEFAULT_COLLAPSE_DEPTH starts
 * collapsed to avoid huge object/array walls.
 */
function JsonNode({ value, depth, propertyKey }: JsonNodeProps) {
  const keyPrefix = propertyKey ? (
    <span className="font-mono text-sky-800 dark:text-sky-200">{JSON.stringify(propertyKey)}: </span>
  ) : null;

  if (value === null) {
    return (
      <span>
        {keyPrefix}
        <span className="text-neutral-500">null</span>
      </span>
    );
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return (
      <span>
        {keyPrefix}
        <span className={cn("break-all font-mono", OPERATOR_TYPOGRAPHY.helper)}>{JSON.stringify(value)}</span>
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          {keyPrefix}[]
        </span>
      );
    }

    if (depth >= DEFAULT_COLLAPSE_DEPTH) {
      return (
        <div className="pl-2">
          {keyPrefix}
          <Collapsible defaultOpen={false} className="w-full min-w-0">
            <CollapsibleTrigger
              className={cn("text-left text-sky-700 underline dark:text-sky-300", OPERATOR_TYPOGRAPHY.helper)}
              type="button"
              aria-label={`Expand JSON array of ${String(value.length)} items`}
            >
              [array · {value.length} items] — expand
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="list-none space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-600">
                {value.map((item, i) => (
                  <li key={i} className="min-w-0 break-words">
                    <JsonNode value={item} depth={depth + 1} />
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <div className="min-w-0 pl-1">
        {keyPrefix}
        <ul className="list-none space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-600">
          {value.map((item, i) => (
            <li key={i} className="min-w-0 break-words">
              <span className="text-neutral-400">[{i}] </span>
              <JsonNode value={item} depth={depth + 1} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return (
        <span>
          {keyPrefix}
          {"{}"}
        </span>
      );
    }

    if (depth >= DEFAULT_COLLAPSE_DEPTH) {
      return (
        <div className="pl-2">
          {keyPrefix}
          <Collapsible defaultOpen={false} className="w-full min-w-0">
            <CollapsibleTrigger
              className={cn("text-left text-sky-700 underline dark:text-sky-300", OPERATOR_TYPOGRAPHY.helper)}
              type="button"
              aria-label={`Expand JSON object with ${String(entries.length)} keys`}
            >
              {`{object · ${entries.length} keys}`} — expand
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-600">
                {entries.map(([k, v]) => (
                  <div key={k} className={cn("min-w-0 break-words", OPERATOR_TYPOGRAPHY.helper)}>
                    <JsonNode value={v} depth={depth + 1} propertyKey={k} />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    return (
      <div className="min-w-0 pl-1">
        {keyPrefix}
        <div className="space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-600">
          {entries.map(([k, v]) => (
            <div key={k} className={cn("min-w-0 break-words", OPERATOR_TYPOGRAPHY.helper)}>
              <JsonNode value={v} depth={depth + 1} propertyKey={k} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <span>
      {keyPrefix}
      <span className="text-neutral-400">undefined</span>
    </span>
  );
}

export function CollapsibleJsonTree({
  value,
  className,
  "aria-label": ariaLabel = "JSON payload",
}: {
  value: unknown;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn("max-h-80 overflow-auto rounded bg-white p-3 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper, className)}
      role="region"
      aria-label={ariaLabel}
    >
      <JsonNode value={value} depth={0} />
    </div>
  );
}
