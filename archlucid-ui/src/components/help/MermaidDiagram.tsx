"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useEffect, useId, useMemo, useState } from "react";

import { HelpMarkdownCodeBlock } from "@/components/help/HelpMarkdownCodeBlock";
import { sanitizeMermaidRenderId } from "@/lib/help-mermaid";

export type MermaidDiagramProps = {
  readonly source: string;
};

function useDocumentDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const readDark = (): void => {
      setDark(document.documentElement.classList.contains("dark"));
    };

    readDark();

    const observer = new MutationObserver(readDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return (): void => {
      observer.disconnect();
    };
  }, []);

  return dark;
}

/** Client-rendered Mermaid diagram for trusted in-app help markdown. */
export function MermaidDiagram(props: MermaidDiagramProps): React.JSX.Element {
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`help-mermaid-${reactId}`), [reactId]);
  const dark = useDocumentDarkMode();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram(): Promise<void> {
      setRenderError(null);
      setSvgMarkup(null);

      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: dark ? "dark" : "neutral",
          securityLevel: "strict",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });

        const result = await mermaid.render(renderId, props.source.trim());

        if (!cancelled) {
          setSvgMarkup(result.svg);
        }
      }
      catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Diagram could not be rendered.";
          setRenderError(message);
        }
      }
    }

    void renderDiagram();

    return (): void => {
      cancelled = true;
    };
  }, [props.source, dark, renderId]);

  return (
    <figure className="relative my-4">
      <div
        className={cn(
          "overflow-x-auto rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950/80",
        )}
      >
        {renderError !== null ? (
          <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {renderError}
          </p>
        ) : svgMarkup === null ? (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} aria-live="polite">
            Rendering diagram…
          </p>
        ) : (
          <div
            className="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
            // Mermaid SVG is generated from trusted repo markdown in help topics.
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
            aria-label="Architecture diagram"
          />
        )}
      </div>
      <details className="mt-2">
        <summary className={cn("cursor-pointer font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          View diagram source
        </summary>
        <HelpMarkdownCodeBlock code={props.source} language="mermaid" />
      </details>
    </figure>
  );
}
