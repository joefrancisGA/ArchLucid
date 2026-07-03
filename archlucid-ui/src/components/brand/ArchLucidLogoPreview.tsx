import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ArchLucidLogo } from "@/components/brand/ArchLucidLogo";
import { ArchLucidMark } from "@/components/brand/ArchLucidMark";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";

/**
 * Local visual harness for the new "Option A" brand mark. Not wired into any
 * route or the app shell — drop it into a scratch page (or import it in a test)
 * to eyeball the geometry at the target sizes on light and dark surfaces.
 */
const MARK_SIZES: ReadonlyArray<number> = [16, 24, 32, 48, 96];

function MarkSizeRow() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      {MARK_SIZES.map((markSize) => (
        <div key={markSize} className="flex flex-col items-center gap-1">
          <ArchLucidMark size={markSize} title={`ArchLucid (${markSize}px)`} />

          <span className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{markSize}px</span>
        </div>
      ))}
    </div>
  );
}

function Swatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-6 w-6 rounded border border-neutral-300"
        style={{ backgroundColor: value }}
      />

      <span className={cn("text-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
        {label} <code className="text-neutral-500">{value}</code>
      </span>
    </div>
  );
}

export function ArchLucidLogoPreview() {
  return (
    <div className="space-y-8 p-6">
      <section className="space-y-3">
        <h2 className={cn("font-semibold text-neutral-600", OPERATOR_TYPOGRAPHY.cardTitle)}>Brand colors</h2>

        <div className="flex flex-wrap gap-6">
          <Swatch label="Navy" value={ARCHLUCID_BRAND.navy} />

          <Swatch label="Teal" value={ARCHLUCID_BRAND.teal} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={cn("font-semibold text-neutral-600", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Mark — size legibility (16 / 24 / 32 px targets)
        </h2>

        <MarkSizeRow />
      </section>

      <section className="space-y-3">
        <h2 className={cn("font-semibold text-neutral-600", OPERATOR_TYPOGRAPHY.cardTitle)}>Logo variants</h2>

        <div className="flex flex-col gap-4">
          <ArchLucidLogo variant="full" />

          <ArchLucidLogo variant="compact" />

          <ArchLucidLogo variant="mark" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={cn("font-semibold text-neutral-600", OPERATOR_TYPOGRAPHY.cardTitle)}>
          On dark surface
        </h2>

        <div className="flex flex-col gap-4 rounded-lg bg-[#0B1D3A] p-6">
          <ArchLucidLogo variant="full" navyColor="#FFFFFF" />

          <ArchLucidLogo variant="mark" navyColor="#FFFFFF" />
        </div>
      </section>
    </div>
  );
}
