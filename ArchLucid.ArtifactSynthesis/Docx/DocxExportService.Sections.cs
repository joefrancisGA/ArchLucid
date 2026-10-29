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
        AppendComparisonStringList(
            body,
            c.SummaryHighlights,
            "Summary highlights were not stored.",
            "Summary highlights were stored as an empty list.");

        WordDocumentBuilder.AddHeading(body, "Decision Changes", DocxStyleIds.Heading2);
        AppendComparisonDecisionChanges(body, c.DecisionChanges);

        WordDocumentBuilder.AddHeading(body, "Requirement Changes", DocxStyleIds.Heading2);
        AppendComparisonRequirementChanges(body, c.RequirementChanges);

        WordDocumentBuilder.AddHeading(body, "Security Posture Delta", DocxStyleIds.Heading2);
        AppendComparisonSecurityChanges(body, c.SecurityChanges);

        WordDocumentBuilder.AddHeading(body, "Topology Changes", DocxStyleIds.Heading2);
        AppendComparisonTopologyChanges(body, c.TopologyChanges);

        WordDocumentBuilder.AddHeading(body, "Cost Delta", DocxStyleIds.Heading2);
        AppendComparisonCostChanges(body, c.CostChanges);

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
        AppendExplanationStringList(
            body,
            e.KeyDrivers,
            "Key drivers were not stored.",
            "Key drivers were stored as an empty list.");

        WordDocumentBuilder.AddHeading(body, "Risk Implications", DocxStyleIds.Heading2);
        AppendExplanationStringList(
            body,
            e.RiskImplications,
            "Risk implications were not stored.",
            "Risk implications were stored as an empty list.");

        WordDocumentBuilder.AddHeading(body, "Cost Implications", DocxStyleIds.Heading2);
        AppendExplanationStringList(
            body,
            e.CostImplications,
            "Cost implications were not stored.",
            "Cost implications were stored as an empty list.");

        WordDocumentBuilder.AddHeading(body, "Compliance Implications", DocxStyleIds.Heading2);
        AppendExplanationStringList(
            body,
            e.ComplianceImplications,
            "Compliance implications were not stored.",
            "Compliance implications were stored as an empty list.");
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
        AppendExplanationStringList(
            body,
            e.MajorChanges,
            "Major changes were not stored.",
            "Major changes were stored as an empty list.");

        WordDocumentBuilder.AddHeading(body, "Key Tradeoffs (AI)", DocxStyleIds.Heading2);
        AppendExplanationStringList(
            body,
            e.KeyTradeoffs,
            "Key tradeoffs were not stored.",
            "Key tradeoffs were stored as an empty list.");
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

    private static void AppendComparisonStringList(
        Body body,
        IReadOnlyList<string>? values,
        string notStoredCopy,
        string storedEmptyCopy)
    {
        if (values is null)
        {
            WordDocumentBuilder.AddBodyText(body, notStoredCopy);
            return;
        }

        if (values.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, storedEmptyCopy);
            return;
        }

        WordDocumentBuilder.AddBulletList(body, values.Select(SanitizeArtifactText));
    }

    private static void AppendExplanationStringList(
        Body body,
        IReadOnlyList<string>? values,
        string notStoredCopy,
        string storedEmptyCopy)
    {
        if (values is null)
        {
            WordDocumentBuilder.AddBodyText(body, notStoredCopy);
            return;
        }

        if (values.Count == 0)
        {
            WordDocumentBuilder.AddBulletList(body, [storedEmptyCopy]);
            return;
        }

        WordDocumentBuilder.AddBulletList(body, values.Select(SanitizeArtifactText));
    }

    private static void AppendComparisonDecisionChanges(Body body, IReadOnlyList<DecisionDelta>? changes)
    {
        if (changes is null)
        {
            WordDocumentBuilder.AddBodyText(body, "Decision changes were not stored.");
            return;
        }

        if (changes.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Decision changes were stored as an empty list.");
            return;
        }

        foreach (DecisionDelta d in changes)
            WordDocumentBuilder.AddBodyText(
                body,
                SanitizeArtifactText(
                    $"{d.DecisionKey}: {FormatOptional(d.BaseValue)} → {FormatOptional(d.TargetValue)} ({d.ChangeType})"));
    }

    private static void AppendComparisonRequirementChanges(Body body, IReadOnlyList<RequirementDelta>? changes)
    {
        if (changes is null)
        {
            WordDocumentBuilder.AddBodyText(body, "Requirement changes were not stored.");
            return;
        }

        if (changes.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Requirement changes were stored as an empty list.");
            return;
        }

        foreach (RequirementDelta r in changes)
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
    }

    private static void AppendComparisonSecurityChanges(Body body, IReadOnlyList<SecurityDelta>? changes)
    {
        if (changes is null)
        {
            WordDocumentBuilder.AddBodyText(body, "Security control changes were not stored.");
            return;
        }

        if (changes.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Security control changes were stored as an empty list.");
            return;
        }

        foreach (SecurityDelta s in changes)
            WordDocumentBuilder.AddBodyText(
                body,
                SanitizeArtifactText(
                    $"{FormatComparisonControlName(s.ControlName)}: {FormatComparisonSecurityStatus(s.BaseStatus, isPrior: true)} → {FormatComparisonSecurityStatus(s.TargetStatus, isPrior: false)}"));
    }

    private static void AppendComparisonTopologyChanges(Body body, IReadOnlyList<TopologyDelta>? changes)
    {
        if (changes is null)
        {
            WordDocumentBuilder.AddBodyText(body, "Topology resource changes were not stored.");
            return;
        }

        if (changes.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Topology resource changes were stored as an empty list.");
            return;
        }

        foreach (TopologyDelta t in changes)
            WordDocumentBuilder.AddBodyText(
                body,
                SanitizeArtifactText(
                    $"{FormatComparisonTopologyResource(t.Resource)} ({t.ChangeType})"));
    }

    private static void AppendComparisonCostChanges(Body body, IReadOnlyList<CostDelta>? changes)
    {
        if (changes is null)
        {
            WordDocumentBuilder.AddBodyText(body, "Cost changes were not stored.");
            return;
        }

        if (changes.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Cost changes were stored as an empty list.");
            return;
        }

        foreach (CostDelta x in changes)
            WordDocumentBuilder.AddBodyText(
                body,
                SanitizeArtifactText(
                    $"Max monthly: {FormatComparisonCostAmount(x.BaseCost, isPrior: true)} → {FormatComparisonCostAmount(x.TargetCost, isPrior: false)}"));
    }
}
