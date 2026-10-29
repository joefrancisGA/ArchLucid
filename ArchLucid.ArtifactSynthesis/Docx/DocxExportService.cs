using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.ArtifactSynthesis.Docx.Models;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.ArtifactSynthesis.Sanitization;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagrams;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Core.Manifest.Sections;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.ArtifactSynthesis.Docx;

/// <summary>
///     <see cref="IDocxExportService" /> implementation using embedded template, <see cref="IImprovementAdvisorService" />
///     for advisory sections,
///     <see cref="IDiagramImageRenderer" /> for optional Mermaid→PNG rasterization, and OpenXML builders.
/// </summary>
public sealed partial class DocxExportService(
    IImprovementAdvisorService improvementAdvisorService,
    IDiagramImageRenderer diagramImageRenderer) : IDocxExportService
{
    private const int MaxEmbeddedMermaidChars = 48_000;

    /// <inheritdoc />
    public async Task<DocxExportResult> ExportAsync(
        DocxExportRequest request,
        ManifestDocument manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(artifacts);
        FindingsSnapshot findings = request.FindingsSnapshot ?? CreateFallbackFindings(manifest);
        ImprovementPlan improvementPlan = request.ManifestComparison is not null
                ? await improvementAdvisorService
                    .GeneratePlanAsync(manifest, findings, request.ManifestComparison, ct)
                : await improvementAdvisorService
                    .GeneratePlanAsync(manifest, findings, ct)
            ;

        using MemoryStream stream = TemplateLoader.OpenWritableTemplate();

        using (WordprocessingDocument doc = WordprocessingDocument.Open(stream, true))
        {
            MainDocumentPart main = doc.MainDocumentPart ??
                                    throw new InvalidOperationException(
                                        "Invalid template: missing main document part.");
            Body body = main.Document.Body ?? throw new InvalidOperationException("Invalid template: missing body.");

            SectionProperties? sectPr = body.Elements<SectionProperties>().LastOrDefault();
            sectPr?.Remove();

            foreach (OpenXmlElement child in body.ChildElements.ToList())
                child.Remove();

            await BuildDocumentAsync(doc, body, request, manifest, artifacts, improvementPlan, ct);

            if (sectPr is not null)
                body.AppendChild(sectPr);
            else

                body.AppendChild(
                    new SectionProperties(
                        new PageSize { Width = 12240U, Height = 15840U },
                        new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440 }));

            doc.Save();
        }

        return new DocxExportResult
        {
            FileName = $"archlucid-architecture-package-{manifest.ManifestId:N}.docx", Content = stream.ToArray()
        };
    }

    private static string SanitizeArtifactText(string? text)
    {
        return LlmArtifactFreeTextSanitizer.Sanitize(text ?? string.Empty);
    }

    private static string FormatTopologyResourceLine(string? resource)
    {
        string formatted = DocxManifestFieldPresentation.FormatManifestTableCell(resource, "Resource");

        if (formatted.Contains("was not stored", StringComparison.Ordinal)
            || formatted.Contains("stored empty", StringComparison.Ordinal))
        {
            return formatted;
        }

        return $"Resource: {SanitizeArtifactText(resource)}";
    }

    private static string FormatTopologyGapLine(string? gap)
    {
        string formatted = DocxManifestFieldPresentation.FormatManifestTableCell(gap, "Gap text");

        if (formatted.Contains("was not stored", StringComparison.Ordinal)
            || formatted.Contains("stored empty", StringComparison.Ordinal))
        {
            return formatted;
        }

        return $"Gap: {SanitizeArtifactText(gap)}";
    }

    private static string FormatSecurityGapLine(string? gap)
    {
        string formatted = DocxManifestFieldPresentation.FormatManifestTableCell(gap, "Security gap");

        if (formatted.Contains("was not stored", StringComparison.Ordinal)
            || formatted.Contains("stored empty", StringComparison.Ordinal))
        {
            return formatted;
        }

        return $"Security gap: {SanitizeArtifactText(gap)}";
    }

    private static string FormatComplianceGapLine(string? gap)
    {
        string formatted = DocxManifestFieldPresentation.FormatManifestTableCell(gap, "Compliance gap");

        if (formatted.Contains("was not stored", StringComparison.Ordinal)
            || formatted.Contains("stored empty", StringComparison.Ordinal))
        {
            return formatted;
        }

        return $"Compliance gap: {SanitizeArtifactText(gap)}";
    }

    private static string FormatCostNoteLine(string? note)
    {
        string formatted = DocxManifestFieldPresentation.FormatManifestTableCell(note, "Cost note");

        if (formatted.Contains("was not stored", StringComparison.Ordinal)
            || formatted.Contains("stored empty", StringComparison.Ordinal))
        {
            return formatted;
        }

        return $"Cost note: {SanitizeArtifactText(note)}";
    }

    /// <summary>Empty findings aligned with the manifest when the export request has no persisted snapshot.</summary>
    private static FindingsSnapshot CreateFallbackFindings(ManifestDocument manifest)
    {
        return new FindingsSnapshot
        {
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
            FindingsSnapshotId = manifest.FindingsSnapshotId,
            RunId = manifest.RunId,
            ContextSnapshotId = manifest.ContextSnapshotId,
            GraphSnapshotId = manifest.GraphSnapshotId,
            CreatedUtc = manifest.CreatedUtc,
            Findings = []
        };
    }

    private async Task BuildDocumentAsync(
        WordprocessingDocument doc,
        Body body,
        DocxExportRequest request,
        ManifestDocument manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        ImprovementPlan improvementPlan,
        CancellationToken ct)
    {
        WordDocumentBuilder.AddStyledParagraph(body, SanitizeArtifactText(request.DocumentTitle), DocxStyleIds.Title);
        WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText(request.Subtitle));
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddBodyText(body, $"Run ID: {manifest.RunId}");
        WordDocumentBuilder.AddBodyText(body, $"Manifest ID: {manifest.ManifestId}");
        WordDocumentBuilder.AddBodyText(body, $"Generated: {manifest.CreatedUtc:u}");
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddBodyText(
            body,
            "Review continuity: in the operator shell, open Reviews and navigate to " +
            $"\"/architecture/reviews/{manifest.RunId:D}\" to return to this run after export.");
        WordDocumentBuilder.AddSpacer(body, 2);

        if (!string.IsNullOrWhiteSpace(request.CareerExportHonestyPlainText))
        {
            WordDocumentBuilder.AddHeading(body, "Career export honesty");
            WordDocumentBuilder.AddMultilineBodyText(body, SanitizeArtifactText(request.CareerExportHonestyPlainText));
            WordDocumentBuilder.AddSpacer(body, 2);
        }

        WordDocumentBuilder.AddHeading(body, "Sponsor Summary");

        if (manifest.Metadata.Summary is null)
            WordDocumentBuilder.AddBodyText(body, "Sponsor summary was not stored.");
        else if (string.IsNullOrWhiteSpace(manifest.Metadata.Summary))
            WordDocumentBuilder.AddBodyText(body, "Sponsor summary was stored empty.");
        else
            WordDocumentBuilder.AddMultilineBodyText(body, SanitizeArtifactText(manifest.Metadata.Summary));

        WordDocumentBuilder.AddSpacer(body);

        if (request.RunExplanation is not null)
            AppendRunExplanation(body, request.RunExplanation);

        if (request.IncludeArchitectureDiagram)

            await AppendArchitectureDiagramSectionAsync(doc, body, manifest, artifacts, ct);

        if (request.IncludeCoverageSection)
        {
            WordDocumentBuilder.AddHeading(body, "Requirements Coverage");
            List<(string Name, string Status, string Mandatory, string Notes)> reqRows = [];

            foreach (RequirementCoverageItem item in manifest.Requirements.Covered)
                reqRows.Add((
                    DocxManifestFieldPresentation.FormatManifestTableCell(item.RequirementName, "Requirement name"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(item.CoverageStatus, "Coverage status"),
                    ArchitectureManifestNarrativeHonestyCopy.FormatMandatoryFlagDocx(item),
                    DocxManifestFieldPresentation.FormatManifestTableCell(item.RequirementText, "Requirement text")));

            foreach (RequirementCoverageItem item in manifest.Requirements.Uncovered)
                reqRows.Add((
                    DocxManifestFieldPresentation.FormatManifestTableCell(item.RequirementName, "Requirement name"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(item.CoverageStatus, "Coverage status"),
                    ArchitectureManifestNarrativeHonestyCopy.FormatMandatoryFlagDocx(item),
                    DocxManifestFieldPresentation.FormatManifestTableCell(item.RequirementText, "Requirement text")));

            if (reqRows.Count == 0)
                WordDocumentBuilder.AddBodyText(body, "No requirements were recorded.");
            else
                WordDocumentBuilder.AddFourColumnTable(
                    body,
                    ("Requirement", "Coverage", "Mandatory", "Notes"),
                    reqRows);
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Topology Posture");

        if (manifest.Topology.Resources.Count > 0)

            foreach (string resource in manifest.Topology.Resources)
                WordDocumentBuilder.AddBodyText(body, FormatTopologyResourceLine(resource));

        else
            WordDocumentBuilder.AddBodyText(body, "Topology resources were stored empty.");

        if (manifest.Topology.SelectedPatterns.Count > 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Selected patterns:");
            WordDocumentBuilder.AddBulletList(body, manifest.Topology.SelectedPatterns.Select(SanitizeArtifactText));
        }
        else
        {
            WordDocumentBuilder.AddBodyText(body, "Selected patterns were stored empty.");
        }

        if (manifest.Topology.Gaps.Count > 0)
        {
            foreach (string gap in manifest.Topology.Gaps)
                WordDocumentBuilder.AddBodyText(body, FormatTopologyGapLine(gap));
        }
        else
        {
            WordDocumentBuilder.AddBodyText(body, "Topology gaps were stored empty.");
        }
        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Security Posture");

        if (manifest.Security.Controls.Count == 0)

            WordDocumentBuilder.AddBodyText(body, "Security controls were stored empty.");

        else
        {
            List<(string ControlId, string ControlName, string Status, string Impact)> secRows = manifest.Security
                .Controls
                .Select(c => (
                    DocxManifestFieldPresentation.FormatManifestTableCell(c.ControlId, "Control id"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(c.ControlName, "Control name"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(c.Status, "Control status"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(c.Impact, "Impact")))
                .ToList();
            WordDocumentBuilder.AddFourColumnTable(
                body,
                ("Control ID", "Control", "Status", "Impact"),
                secRows);
        }

        foreach (string gap in manifest.Security.Gaps)
            WordDocumentBuilder.AddBodyText(body, FormatSecurityGapLine(gap));

        if (manifest.Security.Gaps.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "Security gaps were stored empty.");
        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeComplianceSection)
        {
            WordDocumentBuilder.AddHeading(body, "Compliance Posture");

            if (manifest.Compliance.Controls.Count == 0)

                WordDocumentBuilder.AddBodyText(body, "No compliance posture items were recorded.");

            else
            {
                List<(string ControlId, string ControlName, string AppliesToCategory, string Status)> compRows =
                    manifest.Compliance.Controls
                        .Select(c => (
                            DocxManifestFieldPresentation.FormatManifestTableCell(c.ControlId, "Control id"),
                            DocxManifestFieldPresentation.FormatManifestTableCell(c.ControlName, "Control name"),
                            DocxManifestFieldPresentation.FormatManifestTableCell(c.AppliesToCategory, "Category"),
                            DocxManifestFieldPresentation.FormatManifestTableCell(c.Status, "Status")))
                        .ToList();
                WordDocumentBuilder.AddFourColumnTable(
                    body,
                    ("Control ID", "Control", "Category", "Status"),
                    compRows);
            }

            foreach (string gap in manifest.Compliance.Gaps)
                WordDocumentBuilder.AddBodyText(body, FormatComplianceGapLine(gap));
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Cost Posture");
        WordDocumentBuilder.AddBodyText(
            body,
            $"Max monthly cost: {(manifest.Cost.MaxMonthlyCost.HasValue ? manifest.Cost.MaxMonthlyCost.Value.ToString("0.00") : "Cost was not stored")}");
        WordDocumentBuilder.AddBodyText(
            body,
            $"Cost currency: {DocxManifestFieldPresentation.FormatManifestTableCell(manifest.Cost.CurrencyCode, "Cost currency")}");

        if (manifest.Cost.CostRisks.Count > 0)
        {
            foreach (string risk in manifest.Cost.CostRisks)
                WordDocumentBuilder.AddBodyText(body, $"Cost risk: {SanitizeArtifactText(risk)}");
        }
        else
        {
            WordDocumentBuilder.AddBodyText(body, "Cost risks were stored empty.");
        }

        foreach (string note in manifest.Cost.Notes)
            WordDocumentBuilder.AddBodyText(body, FormatCostNoteLine(note));
        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Assumptions");

        if (manifest.Assumptions.Count == 0)
            WordDocumentBuilder.AddBodyText(body, "No assumptions were recorded.");
        else
            WordDocumentBuilder.AddBulletList(body, manifest.Assumptions.Select(SanitizeArtifactText));

        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Constraints");

        if (manifest.Constraints.MandatoryConstraints.Count == 0
            && manifest.Constraints.Preferences.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "No constraints were recorded.");
        }
        else
        {
            foreach (string item in manifest.Constraints.MandatoryConstraints)
                WordDocumentBuilder.AddBodyText(body, $"Mandatory: {SanitizeArtifactText(item)}");

            foreach (string item in manifest.Constraints.Preferences)
                WordDocumentBuilder.AddBodyText(body, $"Preference: {SanitizeArtifactText(item)}");
        }

        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeIssuesSection)
        {
            WordDocumentBuilder.AddHeading(body, "Unresolved Issues");

            if (manifest.UnresolvedIssues.Items.Count == 0)
                WordDocumentBuilder.AddBodyText(body, "Unresolved issues were stored empty.");
            else
                WordDocumentBuilder.AddIssuesTable(body, manifest.UnresolvedIssues.Items);
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Recommended Improvements");

        if (improvementPlan.Recommendations.Count == 0)

            WordDocumentBuilder.AddBodyText(body, "No recommended improvements were recorded.");

        else

            foreach (ImprovementRecommendation recommendation in improvementPlan.Recommendations.Take(10))
            {
                string titleLine =
                    $"{DocxManifestFieldPresentation.FormatManifestTableCell(recommendation.Title, "Improvement title")} [{DocxManifestFieldPresentation.FormatManifestTableCell(recommendation.Urgency, "Urgency")}]";
                WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText(titleLine));
                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"Rationale: {DocxManifestFieldPresentation.FormatManifestTableCell(recommendation.Rationale, "Rationale")}"));
                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"Suggested Action: {DocxManifestFieldPresentation.FormatManifestTableCell(recommendation.SuggestedAction, "Suggested action")}"));
                WordDocumentBuilder.AddBodyText(
                    body,
                    SanitizeArtifactText(
                        $"Expected Impact: {DocxManifestFieldPresentation.FormatManifestTableCell(recommendation.ExpectedImpact, "Expected impact")}"));
                WordDocumentBuilder.AddSpacer(body);
            }

        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Decisions");

        if (manifest.Decisions.Count == 0)

            WordDocumentBuilder.AddBodyText(body, "No decisions recorded.");

        else
        {
            List<(string Category, string Title, string SelectedOption)> decRows = manifest.Decisions
                .Select(d => (
                    DocxManifestFieldPresentation.FormatManifestTableCell(d.Category, "Decision category"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(d.Title, "Decision title"),
                    DocxManifestFieldPresentation.FormatManifestTableCell(d.SelectedOption, "Selected option")))
                .ToList();
            WordDocumentBuilder.AddThreeColumnTable(
                body,
                decRows,
                ("Category", "Decision", "Selected option"));
        }

        WordDocumentBuilder.AddSpacer(body);

        if (request.ManifestComparison is not null)
            AppendManifestComparison(body, request.ManifestComparison);

        if (request.ComparisonExplanation is not null)
            AppendComparisonExplanation(body, request.ComparisonExplanation);

        if (request.IncludeArtifactsAppendix)
        {
            WordDocumentBuilder.AddHeading(body, "Appendix A — Artifacts");

            if (artifacts.Count == 0)

                WordDocumentBuilder.AddBodyText(body, "No synthesized artifacts were available.");

            else
            {
                List<(string Name, string ArtifactType, string Format)> artRows = artifacts
                    .OrderBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                    .Select(a => (
                        SanitizeArtifactText(a.Name),
                        SanitizeArtifactText(a.ArtifactType),
                        SanitizeArtifactText(a.Format)))
                    .ToList();
                WordDocumentBuilder.AddThreeColumnTable(
                    body,
                    artRows,
                    ("Name", "Type", "Format"));
            }

            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Appendix B — Provenance Summary");
        List<(string, string)> provenanceRows =
        [
            ("Metric", "Value"),
            ("Rule set", SanitizeArtifactText($"{manifest.RuleSetId} {manifest.RuleSetVersion}")),
            ("Manifest hash", SanitizeArtifactText(manifest.ManifestHash)),
            ("Source findings", manifest.Provenance.SourceFindingIds.Count.ToString()),
            ("Source graph nodes", manifest.Provenance.SourceGraphNodeIds.Count.ToString()),
            ("Applied rules", manifest.Provenance.AppliedRuleIds.Count.ToString())
        ];

        foreach ((string label, string value) in CommittedEffectiveGovernanceSnapshotExportFormatter.FormatProvenanceAppendixRows(
                     manifest.EffectiveGovernanceAtCommit))
        {
            provenanceRows.Add((label, SanitizeArtifactText(value)));
        }

        WordDocumentBuilder.AddSimpleTable(body, provenanceRows, true);
    }
}
