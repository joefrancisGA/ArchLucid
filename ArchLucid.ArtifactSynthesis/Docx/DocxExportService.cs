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
        WordDocumentBuilder.AddStyledParagraph(body, request.DocumentTitle, DocxStyleIds.Title);
        WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText(request.Subtitle));
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddBodyText(body, $"Run ID: {manifest.RunId}");
        WordDocumentBuilder.AddBodyText(body, $"Manifest ID: {manifest.ManifestId}");
        WordDocumentBuilder.AddBodyText(body, $"Generated: {manifest.CreatedUtc:u}");
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddBodyText(
            body,
            "Review continuity: in the operator shell, open Reviews and navigate to " +
            $"\"/reviews/{manifest.RunId:D}\" to return to this run after export.");
        WordDocumentBuilder.AddSpacer(body, 2);

        WordDocumentBuilder.AddHeading(body, "Sponsor Summary");
        if (string.IsNullOrWhiteSpace(manifest.Metadata.Summary))
            WordDocumentBuilder.AddBodyText(body, "No summary was recorded for this manifest.");
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
            List<(string Name, string Status, string Mandatory)> reqRows = [];
            foreach (RequirementCoverageItem item in manifest.Requirements.Covered)
                reqRows.Add((item.RequirementName, item.CoverageStatus, item.IsMandatory ? "Yes" : "No"));
            foreach (RequirementCoverageItem item in manifest.Requirements.Uncovered)
                reqRows.Add((item.RequirementName, item.CoverageStatus, item.IsMandatory ? "Yes" : "No"));

            if (reqRows.Count == 0)
                WordDocumentBuilder.AddBodyText(body, "No requirements were recorded.");
            else
                WordDocumentBuilder.AddThreeColumnTable(
                    body,
                    reqRows,
                    ("Requirement", "Coverage", "Mandatory"));
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Topology Posture");
        if (manifest.Topology.Resources.Count > 0)

            foreach (string resource in manifest.Topology.Resources)
                WordDocumentBuilder.AddBodyText(body, $"Resource: {resource}");

        else
            WordDocumentBuilder.AddBodyText(body, "No concrete topology resources were recorded.");

        if (manifest.Topology.SelectedPatterns.Count > 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Selected patterns:");
            WordDocumentBuilder.AddBulletList(body, manifest.Topology.SelectedPatterns);
        }

        foreach (string gap in manifest.Topology.Gaps)
            WordDocumentBuilder.AddBodyText(body, $"Gap: {gap}");
        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Security Posture");
        if (manifest.Security.Controls.Count == 0)

            WordDocumentBuilder.AddBodyText(body, "No security controls were recorded.");

        else
        {
            List<(string ControlId, string ControlName, string Status, string Impact)> secRows = manifest.Security
                .Controls
                .Select(c => (c.ControlId, c.ControlName, c.Status, c.Impact))
                .ToList();
            WordDocumentBuilder.AddFourColumnTable(
                body,
                ("Control ID", "Control", "Status", "Impact"),
                secRows);
        }

        foreach (string gap in manifest.Security.Gaps)
            WordDocumentBuilder.AddBodyText(body, $"Security gap: {gap}");
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
                        .Select(c => (c.ControlId, c.ControlName, c.AppliesToCategory, c.Status))
                        .ToList();
                WordDocumentBuilder.AddFourColumnTable(
                    body,
                    ("Control ID", "Control", "Category", "Status"),
                    compRows);
            }

            foreach (string gap in manifest.Compliance.Gaps)
                WordDocumentBuilder.AddBodyText(body, $"Compliance gap: {gap}");
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Cost Posture");
        WordDocumentBuilder.AddBodyText(
            body,
            $"Max monthly cost: {(manifest.Cost.MaxMonthlyCost.HasValue ? manifest.Cost.MaxMonthlyCost.Value.ToString("0.00") : "Not specified")}");

        foreach (string risk in manifest.Cost.CostRisks)
            WordDocumentBuilder.AddBodyText(body, $"Cost risk: {risk}");

        foreach (string note in manifest.Cost.Notes)
            WordDocumentBuilder.AddBodyText(body, $"Cost note: {note}");
        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeIssuesSection)
        {
            WordDocumentBuilder.AddHeading(body, "Unresolved Issues");
            if (manifest.UnresolvedIssues.Items.Count == 0)
                WordDocumentBuilder.AddBodyText(body, "No unresolved issues.");
            else
                WordDocumentBuilder.AddIssuesTable(body, manifest.UnresolvedIssues.Items);
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Recommended Improvements");
        if (improvementPlan.Recommendations.Count == 0)

            WordDocumentBuilder.AddBodyText(body, "No significant improvements were identified.");

        else

            foreach (ImprovementRecommendation recommendation in improvementPlan.Recommendations.Take(10))
            {
                WordDocumentBuilder.AddBodyText(body,
                    SanitizeArtifactText($"{recommendation.Title} [{recommendation.Urgency}]"));
                WordDocumentBuilder.AddBodyText(body, SanitizeArtifactText($"Rationale: {recommendation.Rationale}"));
                WordDocumentBuilder.AddBodyText(body,
                    SanitizeArtifactText($"Suggested Action: {recommendation.SuggestedAction}"));
                WordDocumentBuilder.AddBodyText(body,
                    SanitizeArtifactText($"Expected Impact: {recommendation.ExpectedImpact}"));
                WordDocumentBuilder.AddSpacer(body);
            }

        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Decisions");
        if (manifest.Decisions.Count == 0)

            WordDocumentBuilder.AddBodyText(body, "No decisions recorded.");

        else
        {
            List<(string Category, string Title, string SelectedOption)> decRows = manifest.Decisions
                .Select(d => (d.Category, d.Title, d.SelectedOption))
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
                    .Select(a => (a.Name, a.ArtifactType, a.Format))
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
            ("Rule set", $"{manifest.RuleSetId} {manifest.RuleSetVersion}"),
            ("Manifest hash", manifest.ManifestHash),
            ("Source findings", manifest.Provenance.SourceFindingIds.Count.ToString()),
            ("Source graph nodes", manifest.Provenance.SourceGraphNodeIds.Count.ToString()),
            ("Applied rules", manifest.Provenance.AppliedRuleIds.Count.ToString())
        ];

        foreach ((string label, string value) in CommittedEffectiveGovernanceSnapshotExportFormatter.FormatProvenanceAppendixRows(
                     manifest.EffectiveGovernanceAtCommit))
        {
            provenanceRows.Add((label, value));
        }

        WordDocumentBuilder.AddSimpleTable(body, provenanceRows, true);
    }
}
