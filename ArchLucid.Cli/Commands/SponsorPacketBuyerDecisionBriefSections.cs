using System.Globalization;
using System.Text;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Section builders for <see cref="SponsorPacketBuyerDecisionBriefBuilder" />.
/// </summary>
internal static class SponsorPacketBuyerDecisionBriefSections
{
    internal static string DeriveDisposition(PackManifestSummary manifest, LimitationsSummary limitations)
    {
        if (limitations.HoldReasons.Count > 0)
            return "HOLD";

        if (manifest.DemoDataWarning || limitations.WarnReasons.Count > 0)
            return "WARN";

        return "PASS";
    }

    internal static void AppendOutcomeSection(
        StringBuilder sb,
        string disposition,
        SponsorReport sponsor,
        PackManifestSummary manifest)
    {
        string headline = disposition switch
        {
            "PASS" => "Architecture review completed. Findings are committed and sponsor-send ready.",
            "WARN" => "Architecture review completed with caveats. Review `limitations.md` before external circulation.",
            "HOLD" => "Architecture review completed. Sponsor send is on hold pending resolution of `limitations.md` items.",
            _ => "Architecture review completed.",
        };

        sb.AppendLine(headline);

        if (sponsor.SystemCount.HasValue)
        {
            sb.AppendLine();
            sb.AppendLine(CultureInfo.InvariantCulture,
                $"{sponsor.SystemCount.Value} system{(sponsor.SystemCount.Value == 1 ? string.Empty : "s")} evaluated in this committed run.");
        }

        if (manifest.DemoDataWarning)
        {
            sb.AppendLine();
            sb.AppendLine("**Demo data:** This packet was generated from a demo or synthetic tenant. Do not present as evidence of a live architecture review.");
        }
    }

    internal static void AppendValueSection(StringBuilder sb, SponsorReport sponsor, string? valueParagraph)
    {
        if (sponsor.TotalEstimatedUsdSavings.HasValue)
        {
            string formatted = sponsor.TotalEstimatedUsdSavings.Value.ToString("C0", CultureInfo.InvariantCulture);
            string scope = string.IsNullOrWhiteSpace(sponsor.HeadlineSavingsScopeDescription)
                ? RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware
                : sponsor.HeadlineSavingsScopeDescription;
            string systemRowScope = string.IsNullOrWhiteSpace(sponsor.SystemRowSavingsScopeDescription)
                ? RoiSponsorFacingScopeDescriptions.SystemRowSnapshotPotential
                : sponsor.SystemRowSavingsScopeDescription;

            sb.AppendLine(CultureInfo.InvariantCulture,
                $"**Estimated savings:** {formatted} ({scope})");
            sb.AppendLine();
            sb.AppendLine(CultureInfo.InvariantCulture, $"**Per-system scope:** {systemRowScope}");
            sb.AppendLine();
            sb.AppendLine(RoiSponsorFacingScopeDescriptions.NonAdditivityCaveat);
            sb.AppendLine();
            sb.AppendLine("This is a projected estimate based on architecture findings. It is not a guarantee and depends on the buyer's implementation choices and environment.");
        }
        else
        {
            sb.AppendLine("Savings estimate not available in this packet. See `sponsor-report.json` when present.");
        }

        if (!string.IsNullOrWhiteSpace(valueParagraph))
        {
            sb.AppendLine();

            string truncated = valueParagraph.Length > 600
                ? string.Concat(valueParagraph.AsSpan(0, 597), "...")
                : valueParagraph;

            sb.AppendLine(truncated);
        }
    }

    internal static void AppendCaveatsSection(
        StringBuilder sb,
        LimitationsSummary limitations,
        PackManifestSummary manifest)
    {
        bool anyCaveats = false;

        if (manifest.DemoDataWarning)
        {
            sb.AppendLine("- **Demo data:** findings reflect synthetic or seeded data, not a live production corpus.");
            anyCaveats = true;
        }

        foreach (string reason in limitations.HoldReasons.Take(5))
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"- **HOLD:** {reason}");
            anyCaveats = true;
        }

        foreach (string reason in limitations.WarnReasons.Take(3))
        {
            sb.AppendLine(CultureInfo.InvariantCulture, $"- **WARN:** {reason}");
            anyCaveats = true;
        }

        if (!anyCaveats)
            sb.AppendLine("No hold or warn caveats at time of packet generation. See `limitations.md` for the full list.");

        sb.AppendLine();
        sb.AppendLine("This brief does not claim live Azure OpenAI validation, SOC certification, marketplace listing, or customer references unless explicitly stated in source artifacts.");
    }

    internal static void AppendEvidenceLinks(StringBuilder sb)
    {
        sb.AppendLine("| Artifact | Purpose |");
        sb.AppendLine("| --- | --- |");

        foreach (SponsorPacketArtifactEntry entry in SponsorPacketArtifactCatalog.IndexEntries)
            sb.AppendLine(CultureInfo.InvariantCulture, $"| `{entry.FileName}` | {entry.Purpose.Replace("|", "/", StringComparison.Ordinal)} |");
    }

    internal static void AppendNextStep(StringBuilder sb, string disposition)
    {
        string step = disposition switch
        {
            "PASS" => "Share this packet with the sponsor reviewer. Confirm the recipient has signed an NDA or equivalent before attaching `provenance-references.json`.",
            "WARN" => "Review `limitations.md` caveats with the account team. Proceed with sponsor circulation if caveats are acknowledged in writing.",
            "HOLD" => "Do not circulate externally. Resolve hold items listed in `limitations.md`, regenerate the packet, and confirm disposition is PASS or WARN before sharing.",
            _ => "Consult `limitations.md` to determine whether this packet is ready for external circulation.",
        };

        sb.AppendLine(step);
    }

    internal sealed record PackManifestSummary(string? GeneratedUtc, bool DemoDataWarning);

    internal sealed record SponsorReport(
        decimal? TotalEstimatedUsdSavings,
        string? HeadlineSavingsScopeDescription,
        string? SystemRowSavingsScopeDescription,
        int? SystemCount);

    internal sealed record LimitationsSummary(List<string> HoldReasons, List<string> WarnReasons);
}
