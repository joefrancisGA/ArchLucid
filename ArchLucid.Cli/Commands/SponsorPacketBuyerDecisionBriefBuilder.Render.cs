using System.Globalization;
using System.Text;

namespace ArchLucid.Cli.Commands;

public static partial class SponsorPacketBuyerDecisionBriefBuilder
{
    private static string RenderBrief(
        string runId,
        string disposition,
        SponsorPacketBuyerDecisionBriefSections.PackManifestSummary manifest,
        SponsorPacketBuyerDecisionBriefSections.SponsorReport sponsor,
        SponsorPacketBuyerDecisionBriefSections.LimitationsSummary limitations,
        string? valueParagraph,
        string? executionProvenance)
    {
        StringBuilder sb = new();
        string generatedUtc = manifest.GeneratedUtc ?? DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);

        sb.AppendLine("> Buyer-safe. No internal diagnostics, secrets, or raw prompts. Review `limitations.md` before external circulation.");
        sb.AppendLine();
        sb.AppendLine("# Buyer decision brief");
        sb.AppendLine();
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Run:** `{runId.Trim()}`  ");
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Generated (UTC):** {generatedUtc}  ");
        sb.AppendLine(CultureInfo.InvariantCulture, $"**Sponsor-send disposition:** **{disposition}**");

        if (!string.IsNullOrWhiteSpace(executionProvenance))
        {
            sb.AppendLine();
            sb.AppendLine(CultureInfo.InvariantCulture, $"**Evidence basis (execution mode):** **{executionProvenance}**");
        }

        sb.AppendLine();
        sb.AppendLine("## Outcome");
        sb.AppendLine();
        SponsorPacketBuyerDecisionBriefSections.AppendOutcomeSection(sb, disposition, sponsor, manifest);
        sb.AppendLine();
        sb.AppendLine("## Quantified value");
        sb.AppendLine();
        SponsorPacketBuyerDecisionBriefSections.AppendValueSection(sb, sponsor, valueParagraph);
        sb.AppendLine();
        sb.AppendLine("## Top caveats");
        sb.AppendLine();
        SponsorPacketBuyerDecisionBriefSections.AppendCaveatsSection(sb, limitations, manifest);
        sb.AppendLine();
        sb.AppendLine("## Evidence links");
        sb.AppendLine();
        SponsorPacketBuyerDecisionBriefSections.AppendEvidenceLinks(sb);
        sb.AppendLine();
        sb.AppendLine("## Recommended next step");
        sb.AppendLine();
        SponsorPacketBuyerDecisionBriefSections.AppendNextStep(sb, disposition);

        return sb.ToString();
    }
}
