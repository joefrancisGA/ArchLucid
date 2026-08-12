"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";

import { HelpMarkdownCodeBlock } from "@/components/help/HelpMarkdownCodeBlock";
import {
  fitMermaidSvgElementToHost,
  prepareMermaidSvgForResponsiveLayout,
  sanitizeMermaidRenderId,
} from "@/lib/help/help-mermaid";

export type MermaidDiagramProps = {
  readonly source: string;
  readonly accessibleName: string;
  readonly description?: string;
  readonly themeVariables?: Readonly<Record<string, string>>;
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

/** True once the diagram frame has been on-screen (avoids collapsed Mermaid layout inside closed details). */
function useHasBeenVisible(targetRef: RefObject<HTMLElement | null>): boolean {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (hasBeenVisible) {
      return;
    }

    const node = targetRef.current;

    if (node === null) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setHasBeenVisible(true);

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasBeenVisible(true);
        }
      },
      { threshold: 0 },
    );

    observer.observe(node);

    return (): void => {
      observer.disconnect();
    };
  }, [hasBeenVisible, targetRef]);

  return hasBeenVisible;
}

/** Client-rendered Mermaid diagram for trusted in-app help markdown. */
export function MermaidDiagram(props: MermaidDiagramProps): React.JSX.Element {
  const { source, accessibleName, description, themeVariables } = props;
  const reactId = useId();
  const renderId = useMemo(() => sanitizeMermaidRenderId(`help-mermaid-${reactId}`), [reactId]);
  const frameRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const hasBeenVisible = useHasBeenVisible(frameRef);
  const dark = useDocumentDarkMode();
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasBeenVisible) {
      return;
    }

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
          ...(themeVariables !== undefined ? { themeVariables: { ...themeVariables } } : {}),
        });

        const result = await mermaid.render(renderId, source.trim());

        if (!cancelled) {
          setSvgMarkup(prepareMermaidSvgForResponsiveLayout(result.svg));
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
  }, [source, dark, renderId, hasBeenVisible, themeVariables]);

  useLayoutEffect(() => {
    if (svgMarkup === null) {
      return;
    }

    const host = hostRef.current;
    const svg = host?.querySelector("svg");

    if (host === null || host === undefined || svg === null || !(svg instanceof SVGSVGElement)) {
      return;
    }

    const applyFit = (): void => {
      const width = host.clientWidth;

      if (width <= 0) {
        return;
      }

      fitMermaidSvgElementToHost(svg, width);
    };

    applyFit();

    // Mermaid layout can settle one frame after insert; re-fit once more.
    const rafId = window.requestAnimationFrame(applyFit);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            applyFit();
          });

    resizeObserver?.observe(host);

    return (): void => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [svgMarkup]);

  const descriptionId = description !== undefined ? `${renderId}-description` : undefined;

  return (
    <figure className="relative my-4 w-full min-w-0" role="img" aria-label={accessibleName} aria-describedby={descriptionId}>
      <div
        ref={frameRef}
        className={cn(
          "w-full min-w-0 overflow-x-auto rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950/80",
        )}
        data-testid="mermaid-diagram-frame"
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
            ref={hostRef}
            className="w-full min-w-0 [&_svg]:block"
            // Mermaid SVG is generated from trusted repo markdown in help topics.
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
            aria-hidden="true"
            data-testid="mermaid-diagram-svg-host"
          />
        )}
      </div>
      {description !== undefined ? (
        <figcaption id={descriptionId} className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {description}
        </figcaption>
      ) : null}
      <details className="mt-2">
        <summary className={cn("cursor-pointer font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          View diagram source
        </summary>
        <HelpMarkdownCodeBlock code={source} language="mermaid" />
      </details>
    </figure>
  );
}
