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
            WordDocumentBuilder.AddBodyText(body, "No summary highlights were recorded.");
        else
            WordDocumentBuilder.AddBulletList(body, c.SummaryHighlights.Select(SanitizeArtifactText));

        WordDocumentBuilder.AddHeading(body, "Decision Changes", DocxStyleIds.Heading2);
        if (c.DecisionChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No decision changes were recorded.");
        else

            foreach (DecisionDelta d in c.DecisionChanges)

                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"{d.DecisionKey}: {FormatOptional(d.BaseValue)} → {FormatOptional(d.TargetValue)} ({d.ChangeType})"));

        WordDocumentBuilder.AddHeading(body, "Requirement Changes", DocxStyleIds.Heading2);
        if (c.RequirementChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No requirement changes were recorded.");
        else

            foreach (RequirementDelta r in c.RequirementChanges)
            {
                string requirementName = DocxManifestFieldPresentation.FormatManifestTableCell(
                    r.RequirementName,
                    "Requirement name");
                string line = requirementName.Contains("was not stored", StringComparison.Ordinal)
                    || requirementName.Contains("stored empty", StringComparison.Ordinal)
                    ? $"{requirementName} {r.ChangeType}"
                    : $"{requirementName}: {r.ChangeType}";

                WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText(line));
            }

        WordDocumentBuilder.AddHeading(body, "Security Posture Delta", DocxStyleIds.Heading2);
        if (c.SecurityChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No security control changes were stored.");
        else

            foreach (SecurityDelta s in c.SecurityChanges)

                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"{FormatComparisonControlName(s.ControlName)}: {FormatComparisonSecurityStatus(s.BaseStatus, isPrior: true)} → {FormatComparisonSecurityStatus(s.TargetStatus, isPrior: false)}"));

        WordDocumentBuilder.AddHeading(body, "Topology Changes", DocxStyleIds.Heading2);
        if (c.TopologyChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No topology resource changes were stored.");
        else

            foreach (TopologyDelta t in c.TopologyChanges)
                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"{FormatComparisonTopologyResource(t.Resource)} ({t.ChangeType})"));

        WordDocumentBuilder.AddHeading(body, "Cost Delta", DocxStyleIds.Heading2);
        if (c.CostChanges.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No cost changes were stored.");
        else

            foreach (CostDelta x in c.CostChanges)

                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"Max monthly: {FormatComparisonCostAmount(x.BaseCost, isPrior: true)} → {FormatComparisonCostAmount(x.TargetCost, isPrior: false)}"));

        WordDocumentBuilder.AddSpacer(body);
    }

    private static void AppendRunExplanation(Body body, ExplanationResult e)
    {
        WordDocumentBuilder.AddHeading(body, "Sponsor Narrative (AI)");
        WordDocumentBuilder.AddBodyText(
            body,
            e.Summary is null
                ? "Sponsor narrative summary was not stored."
                : e.Summary.Trim().Length == 0
                    ? "Sponsor narrative summary was stored empty."
                    : SanitizeArtifactText(e.Summary));
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddHeading(body, "Key Drivers", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(
            body,
            e.KeyDrivers.Count > 0
                ? e.KeyDrivers.Select(SanitizeArtifactText)
                : ["Key drivers were stored empty."]);
        WordDocumentBuilder.AddHeading(body, "Risk Implications", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(
            body,
            e.RiskImplications.Count > 0
                ? e.RiskImplications.Select(SanitizeArtifactText)
                : ["Risk implications were stored empty."]);
        WordDocumentBuilder.AddHeading(body, "Cost Implications", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(
            body,
            e.CostImplications.Count > 0
                ? e.CostImplications.Select(SanitizeArtifactText)
                : ["Cost implications were stored empty."]);
        WordDocumentBuilder.AddHeading(body, "Compliance Implications", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(
            body,
            e.ComplianceImplications.Count > 0
                ? e.ComplianceImplications.Select(SanitizeArtifactText)
                : ["Compliance implications were stored empty."]);
        WordDocumentBuilder.AddHeading(body, "Detailed Explanation", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddMultilineBodyText(
            body,
            e.DetailedNarrative is null
                ? "Detailed explanation was not stored."
                : e.DetailedNarrative.Trim().Length == 0
                    ? "Detailed explanation was stored empty."
                    : SanitizeArtifactText(e.DetailedNarrative));
        WordDocumentBuilder.AddSpacer(body, 2);
    }

    private static void AppendComparisonExplanation(Body body, ComparisonExplanationResult e)
    {
        WordDocumentBuilder.AddHeading(body, "Sponsor Change Narrative (AI)");
        WordDocumentBuilder.AddBodyText(
            body,
            e.HighLevelSummary is null
                ? "Change narrative summary was not stored."
                : e.HighLevelSummary.Trim().Length == 0
                    ? "Change narrative summary was stored empty."
                    : SanitizeArtifactText(e.HighLevelSummary));
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddHeading(body, "Major Changes (structured)", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(
            body,
            e.MajorChanges.Count > 0
                ? e.MajorChanges.Select(SanitizeArtifactText)
                : ["Major changes were stored empty."]);
        WordDocumentBuilder.AddHeading(body, "Key Tradeoffs (AI)", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddBulletList(
            body,
            e.KeyTradeoffs.Count > 0
                ? e.KeyTradeoffs.Select(SanitizeArtifactText)
                : ["Key tradeoffs were stored empty."]);
        WordDocumentBuilder.AddHeading(body, "Detailed Explanation", DocxStyleIds.Heading2);
        WordDocumentBuilder.AddMultilineBodyText(
            body,
            e.Narrative is null
                ? "Detailed explanation was not stored."
                : e.Narrative.Trim().Length == 0
                    ? "Detailed explanation was stored empty."
                    : SanitizeArtifactText(e.Narrative));
        WordDocumentBuilder.AddSpacer(body, 2);
    }

    private static string FormatOptional(string? v)
    {
        return DocxManifestFieldPresentation.FormatComparedOptionalValue(v);
    }

    private static string FormatComparisonControlName(string? name) =>
        DocxManifestFieldPresentation.FormatManifestTableCell(name, "Control name");

    private static string FormatComparisonTopologyResource(string? resource) =>
        DocxManifestFieldPresentation.FormatManifestTableCell(resource, "Resource name");

    private static string FormatComparisonSecurityStatus(string? status, bool isPrior)
    {
        if (status is null)
        {
            return isPrior
                ? "Base run control status was not stored."
                : "Target run control status was not stored.";
        }

        if (status.Length == 0 || string.IsNullOrWhiteSpace(status))
        {
            return isPrior
                ? "Base run control status was stored empty."
                : "Target run control status was stored empty.";
        }

        return status.Trim();
    }

    private static string FormatComparisonCostAmount(decimal? cost, bool isPrior)
    {
        if (cost.HasValue)
        {
            return cost.Value.ToString("0.00");
        }

        return isPrior
            ? "Base run max monthly cost was not stored."
            : "Target run max monthly cost was not stored.";
    }
}
