using System.Globalization;

using ArchLucid.Core.GoToMarket;

namespace ArchLucid.Cli.Commands;

/// <summary>Builds a Markdown draft that mirrors <c>docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md</c> fields.</summary>
internal static class RoiBulletinMarkdownFormatter
{
    /// <summary>Literal stamp required on every synthetic statistics row (procurement guardrail).</summary>
    internal const string SyntheticRowStamp = "synthetic example — never published as a real bulletin";

    internal static string FormatDraft(RoiBulletinPreviewPayload payload, int minTenantsUsed)
    {
        if (payload is null) throw new ArgumentNullException(nameof(payload));

        string quarter = string.IsNullOrWhiteSpace(payload.Quarter) ? "(unknown)" : payload.Quarter;

        return string.Join(
            Environment.NewLine, $"# Aggregate ROI bulletin — draft ({quarter})", string.Empty,
            "> **DRAFT — NOT FOR EXTERNAL PUBLICATION.** Owner sign-off required per `docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`.",
            string.Empty, "## Sample",
            $"- **Tenants included (tenant-supplied baseline, quarter window):** {payload.TenantCount.ToString(CultureInfo.InvariantCulture)}",
            $"- **Minimum-N gate used for this CLI run:** {minTenantsUsed.ToString(CultureInfo.InvariantCulture)}",
            string.Empty, "## Headline statistics (baseline review-cycle hours, tenant-supplied only)",
            $"- **Mean:** {FormatHours(payload.MeanBaselineHours)} h",
            $"- **Median (p50):** {FormatHours(payload.MedianBaselineHours)} h",
            $"- **p90:** {FormatHours(payload.P90BaselineHours)} h", string.Empty, "## Next steps",
            "- Paste into the quarterly bulletin workflow after legal/comms review.",
            "- Never attach per-tenant rows; this draft is aggregate-only.", string.Empty);
    }

    internal static string FormatSynthetic(RoiBulletinPreviewPayload payload, int realPublicationMinTenants)
    {
        if (payload is null) throw new ArgumentNullException(nameof(payload));

        string quarter = string.IsNullOrWhiteSpace(payload.Quarter) ? "(unknown)" : payload.Quarter;

        return string.Join(
            Environment.NewLine,
            "> **SYNTHETIC — NOT A PUBLISHED BULLETIN.** Every statistic row below is stamped; do not treat as production data.",
            string.Empty, $"# Aggregate ROI bulletin — synthetic example ({quarter})", string.Empty,
            "> **FORBIDDEN (repository hygiene):** Do not append this output to `docs/CHANGELOG.md`. Do not invent a `## YYYY-MM-DD — ROI bulletin signed:` section. See `docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md`.",
            string.Empty, "## Sample",
            $"- **Tenants included (illustrative N):** {payload.TenantCount.ToString(CultureInfo.InvariantCulture)} — {SyntheticRowStamp}",
            $"- **Real publication still requires ≥ {realPublicationMinTenants.ToString(CultureInfo.InvariantCulture)} qualifying tenants** (admin preview gate). — {SyntheticRowStamp}",
            string.Empty, "## Headline statistics (baseline review-cycle hours — illustrative only)",
            "| Metric | Value |", "|--------|-------|",
            $"| Mean | {FormatHours(payload.MeanBaselineHours)} h — {SyntheticRowStamp} |",
            $"| Median (p50) | {FormatHours(payload.MedianBaselineHours)} h — {SyntheticRowStamp} |",
            $"| p90 | {FormatHours(payload.P90BaselineHours)} h — {SyntheticRowStamp} |", string.Empty,
            "## Provenance (why these numbers are not SQL)",
            $"- Constants are defined on `{nameof(SyntheticAggregateRoiBulletinSample)}` in `ArchLucid.Core` so CLI `--synthetic` matches buyer-facing sample docs.",
            "- Per-run sponsor deltas (findings, audit rows, LLM calls) are computed by `PilotRunDeltaComputer` from persisted demo-seed runs; aggregate **baseline-hour** bulletins normally come from `IRoiBulletinAggregateReader` — this path skips SQL and exists only for shape education.",
            string.Empty);
    }

    private static string FormatHours(decimal? hours)
    {
        return hours is { } h ? h.ToString("0.##", CultureInfo.InvariantCulture) : "—";
    }
}
