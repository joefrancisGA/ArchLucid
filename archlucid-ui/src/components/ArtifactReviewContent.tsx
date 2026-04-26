import { OperatorWarningCallout } from "@/components/OperatorShellMessage";
import type { PreparedArtifactBody } from "@/lib/artifact-review-helpers";

const preBoxCls = "m-0 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-neutral-200 bg-white p-4 font-mono text-sm leading-relaxed dark:border-neutral-700 dark:bg-neutral-950 max-h-[min(70vh,720px)]";

/**
 * Human-readable panel plus optional raw disclosure (deterministic; no HTML injection).
 */
export function ArtifactReviewContent(props: {
  prepared: PreparedArtifactBody;
  contentType: string;
  byteLength: number;
  truncated: boolean;
  contentError: string | null;
}) {
  const { prepared, contentType, byteLength, truncated, contentError } = props;

  if (contentError) {
    return (
      <OperatorWarningCallout>
        <strong>In-shell preview unavailable.</strong>
        <p className="mt-2">{contentError}</p>
        <p className="mt-2 text-sm">
          Use <strong>Download</strong> to open the artifact locally. Descriptor metadata above is still
          valid when the download endpoint succeeds.
        </p>
      </OperatorWarningCallout>
    );
  }

  const rawIsDistinct = prepared.readableText !== prepared.rawText;

  const caption =
    prepared.viewKind === "markdown"
      ? "Markdown (rendered as pre-wrapped text; download for editors or viewers)"
      : prepared.viewKind === "mermaid"
        ? "Mermaid source (paste into a Mermaid viewer or download this file)"
        : prepared.viewKind === "json"
          ? prepared.jsonPrettyFailed
            ? "JSON (invalid — showing raw bytes as text)"
            : "JSON (pretty-printed for review)"
          : "Text content";

  return (
    <div>
      {truncated && (
        <OperatorWarningCallout>
          <strong>Preview truncated.</strong>
          <p className="mt-2 text-sm">
            Showing the first portion of this artifact ({byteLength.toLocaleString()} bytes total). Download
            for the full file.
          </p>
        </OperatorWarningCallout>
      )}

      <p className="mb-2 text-[13px] text-neutral-500 dark:text-neutral-400">
        {caption} · <code>{contentType}</code> · {byteLength.toLocaleString()} bytes
      </p>

      <pre className={preBoxCls}>{prepared.readableText}</pre>

      <details className="mt-4">
        <summary className="cursor-pointer font-semibold text-neutral-700 dark:text-neutral-300">
          Raw UTF-8 content
          {rawIsDistinct ? " (exact, unmodified from API)" : " (same as readable above)"}
        </summary>
        <pre className={`${preBoxCls} mt-3 bg-neutral-50/90 dark:bg-neutral-900/50`}>{prepared.rawText}</pre>
      </details>
    </div>
  );
}
