using ArchiForge.ArtifactSynthesis.Docx.Builders;
using ArchiForge.ArtifactSynthesis.Docx.Helpers;
using ArchiForge.ArtifactSynthesis.Docx.Models;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Decisioning.Models;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchiForge.ArtifactSynthesis.Docx;

public sealed class DocxExportService : IDocxExportService
{
    public Task<DocxExportResult> ExportAsync(
        DocxExportRequest request,
        GoldenManifest manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        CancellationToken ct)
    {
        _ = ct;
        using var stream = TemplateLoader.OpenWritableTemplate();

        using (var doc = WordprocessingDocument.Open(stream, true))
        {
            var main = doc.MainDocumentPart ?? throw new InvalidOperationException("Invalid template: missing main document part.");
            var body = main.Document?.Body ?? throw new InvalidOperationException("Invalid template: missing body.");

            var sectPr = body.Elements<SectionProperties>().LastOrDefault();
            sectPr?.Remove();

            foreach (var child in body.ChildElements.ToList())
                child.Remove();

            BuildDocument(doc, body, request, manifest, artifacts);

            if (sectPr is not null)
                body.AppendChild(sectPr);
            else
            {
                body.AppendChild(
                    new SectionProperties(
                        new PageSize { Width = 12240U, Height = 15840U },
                        new PageMargin { Top = 1440, Right = 1440, Bottom = 1440, Left = 1440 }));
            }

            doc.Save();
        }

        return Task.FromResult(new DocxExportResult
        {
            FileName = $"archiforge-architecture-package-{manifest.ManifestId:N}.docx",
            Content = stream.ToArray()
        });
    }

    private static void BuildDocument(
        WordprocessingDocument doc,
        Body body,
        DocxExportRequest request,
        GoldenManifest manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        WordDocumentBuilder.AddStyledParagraph(body, request.DocumentTitle, DocxStyleIds.Title);
        WordDocumentBuilder.AddBodyText(body, request.Subtitle);
        WordDocumentBuilder.AddSpacer(body);
        WordDocumentBuilder.AddBodyText(body, $"Run ID: {manifest.RunId}");
        WordDocumentBuilder.AddBodyText(body, $"Manifest ID: {manifest.ManifestId}");
        WordDocumentBuilder.AddBodyText(body, $"Generated: {manifest.CreatedUtc:u}");
        WordDocumentBuilder.AddSpacer(body, 2);

        WordDocumentBuilder.AddHeading(body, "Executive Summary", DocxStyleIds.Heading1);
        if (string.IsNullOrWhiteSpace(manifest.Metadata.Summary))
            WordDocumentBuilder.AddBodyText(body, "No summary was recorded for this manifest.");
        else
            WordDocumentBuilder.AddMultilineBodyText(body, manifest.Metadata.Summary);

        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeArchitectureDiagram)
        {
            WordDocumentBuilder.AddHeading(body, "Architecture Diagram", DocxStyleIds.Heading1);
            ImageHelper.AddPngToBody(
                doc,
                body,
                DiagramPlaceholderBytes.Png.ToArray(),
                "Architecture overview (placeholder)",
                ImageHelper.DefaultDiagramWidthEmu,
                ImageHelper.DefaultDiagramHeightEmu);
            WordDocumentBuilder.AddBodyText(
                body,
                "Placeholder image — future releases can embed Mermaid renders or knowledge-graph snapshots.");
            WordDocumentBuilder.AddSpacer(body, 2);
        }

        if (request.IncludeCoverageSection)
        {
            WordDocumentBuilder.AddHeading(body, "Requirements Coverage", DocxStyleIds.Heading1);
            var reqRows = new List<(string Name, string Status, string Mandatory)>();
            foreach (var item in manifest.Requirements.Covered)
                reqRows.Add((item.RequirementName, item.CoverageStatus, item.IsMandatory ? "Yes" : "No"));
            foreach (var item in manifest.Requirements.Uncovered)
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

        WordDocumentBuilder.AddHeading(body, "Topology Posture", DocxStyleIds.Heading1);
        if (manifest.Topology.Resources.Count > 0)
        {
            foreach (var resource in manifest.Topology.Resources)
                WordDocumentBuilder.AddBodyText(body, $"Resource: {resource}");
        }
        else
            WordDocumentBuilder.AddBodyText(body, "No concrete topology resources were recorded.");

        if (manifest.Topology.SelectedPatterns.Count > 0)
        {
            WordDocumentBuilder.AddBodyText(body, "Selected patterns:");
            WordDocumentBuilder.AddBulletList(body, manifest.Topology.SelectedPatterns);
        }

        foreach (var gap in manifest.Topology.Gaps)
            WordDocumentBuilder.AddBodyText(body, $"Gap: {gap}");
        WordDocumentBuilder.AddSpacer(body);

        WordDocumentBuilder.AddHeading(body, "Security Posture", DocxStyleIds.Heading1);
        if (manifest.Security.Controls.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "No security controls were recorded.");
        }
        else
        {
            var secRows = manifest.Security.Controls
                .Select(c => (c.ControlId, c.ControlName, c.Status, c.Impact ?? string.Empty))
                .ToList();
            WordDocumentBuilder.AddFourColumnTable(
                body,
                ("Control ID", "Control", "Status", "Impact"),
                secRows);
        }

        foreach (var gap in manifest.Security.Gaps)
            WordDocumentBuilder.AddBodyText(body, $"Security gap: {gap}");
        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeComplianceSection)
        {
            WordDocumentBuilder.AddHeading(body, "Compliance Posture", DocxStyleIds.Heading1);
            if (manifest.Compliance.Controls.Count == 0)
            {
                WordDocumentBuilder.AddBodyText(body, "No compliance posture items were recorded.");
            }
            else
            {
                var compRows = manifest.Compliance.Controls
                    .Select(c => (c.ControlId, c.ControlName, c.AppliesToCategory ?? string.Empty, c.Status))
                    .ToList();
                WordDocumentBuilder.AddFourColumnTable(
                    body,
                    ("Control ID", "Control", "Category", "Status"),
                    compRows);
            }

            foreach (var gap in manifest.Compliance.Gaps)
                WordDocumentBuilder.AddBodyText(body, $"Compliance gap: {gap}");
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Cost Posture", DocxStyleIds.Heading1);
        WordDocumentBuilder.AddBodyText(
            body,
            $"Max monthly cost: {(manifest.Cost.MaxMonthlyCost.HasValue ? manifest.Cost.MaxMonthlyCost.Value.ToString("0.00") : "Not specified")}");

        foreach (var risk in manifest.Cost.CostRisks)
            WordDocumentBuilder.AddBodyText(body, $"Cost risk: {risk}");

        foreach (var note in manifest.Cost.Notes)
            WordDocumentBuilder.AddBodyText(body, $"Cost note: {note}");
        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeIssuesSection)
        {
            WordDocumentBuilder.AddHeading(body, "Unresolved Issues", DocxStyleIds.Heading1);
            if (manifest.UnresolvedIssues.Items.Count == 0)
                WordDocumentBuilder.AddBodyText(body, "No unresolved issues.");
            else
                WordDocumentBuilder.AddIssuesTable(body, manifest.UnresolvedIssues.Items);
            WordDocumentBuilder.AddSpacer(body);
        }

        WordDocumentBuilder.AddHeading(body, "Decisions", DocxStyleIds.Heading1);
        if (manifest.Decisions.Count == 0)
        {
            WordDocumentBuilder.AddBodyText(body, "No decisions recorded.");
        }
        else
        {
            var decRows = manifest.Decisions
                .Select(d => (d.Category, d.Title, d.SelectedOption))
                .ToList();
            WordDocumentBuilder.AddThreeColumnTable(
                body,
                decRows,
                ("Category", "Decision", "Selected option"));
        }

        WordDocumentBuilder.AddSpacer(body);

        if (request.IncludeArtifactsAppendix)
        {
            WordDocumentBuilder.AddHeading(body, "Appendix A — Artifacts", DocxStyleIds.Heading1);
            if (artifacts.Count == 0)
            {
                WordDocumentBuilder.AddBodyText(body, "No synthesized artifacts were available.");
            }
            else
            {
                var artRows = artifacts
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

        WordDocumentBuilder.AddHeading(body, "Appendix B — Provenance Summary", DocxStyleIds.Heading1);
        WordDocumentBuilder.AddSimpleTable(
            body,
            [
                ("Metric", "Value"),
                ("Rule set", $"{manifest.RuleSetId} {manifest.RuleSetVersion}"),
                ("Manifest hash", manifest.ManifestHash),
                ("Source findings", manifest.Provenance.SourceFindingIds.Count.ToString()),
                ("Source graph nodes", manifest.Provenance.SourceGraphNodeIds.Count.ToString()),
                ("Applied rules", manifest.Provenance.AppliedRuleIds.Count.ToString())
            ],
            headerRow: true);
    }
}
