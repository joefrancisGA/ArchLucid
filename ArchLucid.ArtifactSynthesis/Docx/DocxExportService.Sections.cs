using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.ArtifactSynthesis.Docx;

public sealed partial class DocxExportService
{
    private static void AppendManifestComparison(Body body, ComparisonResult c)
    {
        WordDocumentBuilder.AddHeading(body, "Architecture Comparison");
        WordDocumentBuilder.AddBodyText(
            body,
            $"Base run: {c.BaseRunId} → Target run: {c.TargetRunId}");
        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Summary Highlights", DocxStyleIds.Heading2);
        if (c.SummaryHighlights.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "—");
        else
            WordDocumentBuilder.AddBulletList(body, c.SummaryHighlights);

        WordDocumentBuilder.AddHeading(body, "Decision Changes", DocxStyleIds.Heading2);
        if (c.DecisionChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No decision changes.");
        else

            foreach (DecisionDelta d in c.DecisionChanges)

                WordDocumentBuilder.AddBodyText(
                    body,
                    $"{d.DecisionKey}: {FormatOptional(d.BaseValue)} → {FormatOptional(d.TargetValue)} ({d.ChangeType})");

        WordDocumentBuilder.AddHeading(body, "Requirement Changes", DocxStyleIds.Heading2);
        if (c.RequirementChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No requirement changes.");
        else

            foreach (RequirementDelta r in c.RequirementChanges)
                WordDocumentBuilder.AddBodyText(body, $"{r.RequirementName}: {r.ChangeType}");

        WordDocumentBuilder.AddHeading(body, "Security Posture Delta", DocxStyleIds.Heading2);
        if (c.SecurityChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No security control changes.");
        else

            foreach (SecurityDelta s in c.SecurityChanges)

                WordDocumentBuilder.AddBodyText(
                    body,
                    $"{s.ControlName}: {FormatOptional(s.BaseStatus)} → {FormatOptional(s.TargetStatus)}");

        WordDocumentBuilder.AddHeading(body, "Topology Changes", DocxStyleIds.Heading2);
        if (c.TopologyChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No topology resource changes.");
        else

            foreach (TopologyDelta t in c.TopologyChanges)
                WordDocumentBuilder.AddBodyText(body, $"{t.Resource} ({t.ChangeType})");

        WordDocumentBuilder.AddHeading(body, "Cost Delta", DocxStyleIds.Heading2);
        if (c.CostChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "Maximum monthly cost unchanged.");
        else

            foreach (CostDelta x in c.CostChanges)

                WordDocumentBuilder.AddBodyText(
                    body,
                    $"{FormatCost(x.BaseCost)} → {FormatCost(x.TargetCost)}");

        WordDocumentBuilder.AddSpacer(body);
    }

    private static void AppendRunExplanation(Body body, ExplanationResult e)
    {
        WordDocumentBuilder.AddHeading(body, "Sponsor Narrative (AI)");
        WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText(e.Summary));
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddHeading(body, "Key Drivers", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(body, e.KeyDrivers.Count > 0 ? e.KeyDrivers : ["(none)"]);
        WordDocumentBuilder.AddHeading(body, "Risk Implications", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(body, e.RiskImplications.Count > 0 ? e.RiskImplications : ["(none)"]);
        WordDocumentBuilder.AddHeading(body, "Cost Implications", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(body, e.CostImplications.Count > 0 ? e.CostImplications : ["(none)"]);
        WordDocumentBuilder.AddHeading(body, "Compliance Implications", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(body,
            e.ComplianceImplications.Count > 0 ? e.ComplianceImplications : ["(none)"]);
        WordDocumentBuilder.AddHeading(body, "Detailed Explanation", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddMultilineBodyText(body, SanitizeArtifactText(e.DetailedNarrative));
        WordDocumentBuilder.AddSpacer(body, 2);
    }

    private static void AppendComparisonExplanation(Body body, ComparisonExplanationResult e)
    {
        WordDocumentBuilder.AddHeading(body, "Sponsor Change Narrative (AI)");
        WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText(e.HighLevelSummary));
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddHeading(body, "Major Changes (structured)", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(body, e.MajorChanges.Count > 0 ? e.MajorChanges : ["(none)"]);
        WordDocumentBuilder.AddHeading(body, "Key Tradeoffs (AI)", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(body, e.KeyTradeoffs.Count > 0 ? e.KeyTradeoffs : ["(none)"]);
        WordDocumentBuilder.AddHeading(body, "Detailed Explanation", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddMultilineBodyText(body, SanitizeArtifactText(e.Narrative));
        WordDocumentBuilder.AddSpacer(body, 2);
    }

    private static string FormatOptional(string? v)
    {
        return string.IsNullOrEmpty(v) ? "—" : v;
    }

    private static string FormatCost(decimal? v)
    {
        return v.HasValue ? v.Value.ToString("0.00") : "—";
    }
}
