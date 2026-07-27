using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch14Tests
{
    [Fact]
    public void ConsultingDocxRecommendationsSectionBuilder_Add_omits_callout_when_no_warnings()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new();
        ConsultingDocxTemplateOptions options = new() { ConclusionsText = "All checks passed." };

        ConsultingDocxRecommendationsSectionBuilder.Add(body, report, options);

        string text = body.InnerText;
        text.Should().Contain("Conclusions");
        text.Should().Contain("All checks passed.");
        text.Should().NotContain("Open warnings remain");
    }

    [Fact]
    public void ConsultingDocxRecommendationsSectionBuilder_Add_appends_callout_when_warnings_present()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new() { Warnings = ["Unresolved compliance gap"] };
        ConsultingDocxTemplateOptions options = new();

        ConsultingDocxRecommendationsSectionBuilder.Add(body, report, options);

        body.InnerText.Should().Contain("Open warnings remain and should be resolved or explicitly accepted.");
    }

    [Fact]
    public void ConsultingDocxFindingsSectionBuilder_Add_without_evidence_states_unavailable()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new() { Evidence = null };

        ConsultingDocxFindingsSectionBuilder.Add(body, report);

        body.InnerText.Should().Contain("No evidence package was available for this run.");
    }

    [Fact]
    public void ConsultingDocxFindingsSectionBuilder_Add_with_evidence_renders_constraints_capabilities_and_policies()
    {
        Body body = new();
        ArchitectureAnalysisReport report = new()
        {
            Evidence = new AgentEvidencePackage
            {
                Request = new RequestEvidence
                {
                    Description = "Modernize claims intake.",
                    Constraints = ["PCI scope"],
                    RequiredCapabilities = ["High availability"],
                },
                Policies =
                [
                    new PolicyEvidence
                    {
                        Title = "Baseline",
                        PolicyId = "pol-1",
                        Summary = "Baseline summary",
                        RequiredControls = ["encrypt-at-rest"],
                    },
                ],
            },
        };

        ConsultingDocxFindingsSectionBuilder.Add(body, report);

        string text = body.InnerText;
        text.Should().Contain("Modernize claims intake.");
        text.Should().Contain("PCI scope");
        text.Should().Contain("High availability");
        text.Should().Contain("Policy ID: pol-1");
        text.Should().Contain("Required Controls: encrypt-at-rest");
    }

    [Fact]
    public async Task ConsultingDocxCoverPageBuilder_AddAsync_prefers_branding_logo_and_labels_over_options()
    {
        using MemoryStream stream = new();
        using WordprocessingDocument document = WordprocessingDocument.Create(
            stream, WordprocessingDocumentType.Document, true);
        MainDocumentPart mainPart = document.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        Body body = mainPart.Document.Body!;
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun { RunId = "run-1", RequestId = "req-1" },
        };
        ConsultingDocxTemplateOptions options = new() { IncludeLogo = true };
        ConsultingDocxExportBranding branding = new("Acme Consulting", "Q3 Review", [1, 2, 3, 4]);
        Mock<IDocumentLogoProvider> logoProvider = new();

        await ConsultingDocxCoverPageBuilder.AddAsync(
            mainPart, body, report, options, logoProvider.Object, branding, CancellationToken.None);

        body.InnerText.Should().Contain("Acme Consulting");
        body.InnerText.Should().Contain("Q3 Review");
        mainPart.ImageParts.Should().ContainSingle();
        logoProvider.Verify(
            p => p.GetLogoBytesAsync(It.IsAny<ConsultingDocxTemplateOptions>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConsultingDocxCoverPageBuilder_AddAsync_falls_back_to_logo_provider_when_no_branding()
    {
        using MemoryStream stream = new();
        using WordprocessingDocument document = WordprocessingDocument.Create(
            stream, WordprocessingDocumentType.Document, true);
        MainDocumentPart mainPart = document.AddMainDocumentPart();
        mainPart.Document = new Document(new Body());
        Body body = mainPart.Document.Body!;
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun { RunId = "run-2", RequestId = "req-2" },
            Manifest = null,
        };
        ConsultingDocxTemplateOptions options = new() { IncludeLogo = true };
        Mock<IDocumentLogoProvider> logoProvider = new();
        logoProvider
            .Setup(p => p.GetLogoBytesAsync(options, It.IsAny<CancellationToken>()))
            .ReturnsAsync([9, 9, 9]);

        await ConsultingDocxCoverPageBuilder.AddAsync(
            mainPart, body, report, options, logoProvider.Object, branding: null, CancellationToken.None);

        mainPart.ImageParts.Should().ContainSingle();
        body.InnerText.Should().Contain("Run ID: run-2");
        body.InnerText.Should().Contain("Request ID: req-2");
    }

    [Fact]
    public void DriftReportDocxExport_GenerateDocx_without_drift_items_returns_minimal_document()
    {
        DriftReportDocxExport sut = new();
        DriftAnalysisResult drift = new() { DriftDetected = false, Summary = "No drift detected." };

        byte[] bytes = sut.GenerateDocx(drift, comparisonRecordId: "cmp-1");

        string text = ExtractBodyText(bytes);
        text.Should().Contain("Comparison record: cmp-1");
        text.Should().Contain("Drift detected: No");
        text.Should().Contain("No drift detected.");
        text.Should().NotContain("Differences");
    }

    [Fact]
    public void DriftReportDocxExport_GenerateDocx_with_items_lists_stored_and_regenerated_values()
    {
        DriftReportDocxExport sut = new();
        DriftAnalysisResult drift = new()
        {
            DriftDetected = true,
            Summary = "1 drift difference detected.",
            Items =
            [
                new DriftItem
                {
                    Category = "ValueChange",
                    Path = "$.Confidence",
                    Description = "Confidence changed.",
                    StoredValue = "0.8",
                    RegeneratedValue = "0.9",
                },
            ],
        };

        byte[] bytes = sut.GenerateDocx(drift);

        string text = ExtractBodyText(bytes);
        text.Should().Contain("Drift detected: Yes");
        text.Should().Contain("Differences");
        text.Should().Contain("ValueChange");
        text.Should().Contain("Stored: 0.8");
        text.Should().Contain("Regenerated: 0.9");
    }

    [Fact]
    public void ReplayAuthorityRunRecordFactory_CreateForReplay_clones_source_authority_row()
    {
        Guid replayRunId = Guid.NewGuid();
        ScopeContext callScope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        RunRecord sourceAuthorityRun = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ScopeProjectId = Guid.NewGuid(),
            ProjectId = "existing-project",
            Description = "Original run",
            PackageOrigin = ArchitecturePackageOrigin.Created,
        };
        ArchitectureRequest request = new() { RequestId = "req-clone", SystemName = "ClaimsApi" };

        RunRecord result = ReplayAuthorityRunRecordFactory.CreateForReplay(
            replayRunId, callScope, sourceAuthorityRun, request);

        result.RunId.Should().Be(replayRunId);
        result.TenantId.Should().Be(sourceAuthorityRun.TenantId);
        result.WorkspaceId.Should().Be(sourceAuthorityRun.WorkspaceId);
        result.ScopeProjectId.Should().Be(sourceAuthorityRun.ScopeProjectId);
        result.ProjectId.Should().Be("existing-project");
        result.Description.Should().Be("Original run");
        result.ArchitectureRequestId.Should().Be("req-clone");
        result.StructuralExecutionMode.Should().Be(StructuralExecutionMode.Simulator);
        result.PackageOrigin.Should().Be(ArchitecturePackageOrigin.Created);
    }

    [Fact]
    public void ReplayAuthorityRunRecordFactory_CreateForReplay_uses_call_scope_and_resolves_origin_when_source_missing()
    {
        Guid replayRunId = Guid.NewGuid();
        ScopeContext callScope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        ArchitectureRequest request = new()
        {
            RequestId = "req-fresh",
            SystemName = "PaymentsApi",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        RunRecord result = ReplayAuthorityRunRecordFactory.CreateForReplay(
            replayRunId, callScope, sourceAuthorityRun: null, request);

        result.TenantId.Should().Be(callScope.TenantId);
        result.WorkspaceId.Should().Be(callScope.WorkspaceId);
        result.ScopeProjectId.Should().Be(callScope.ProjectId);
        result.ProjectId.Should().Be("PaymentsApi");
        result.PackageOrigin.Should().Be(ArchitecturePackageOrigin.Created);
        result.StructuralExecutionMode.Should().Be(StructuralExecutionMode.Simulator);
    }

    [Fact]
    public void MarkdownManifestDiffSummaryFormatter_FormatMarkdown_emits_none_placeholders_for_empty_lists()
    {
        MarkdownManifestDiffSummaryFormatter sut = new();
        ManifestDiffResult diff = new() { LeftManifestVersion = "v1", RightManifestVersion = "v2" };

        string markdown = sut.FormatMarkdown(diff);

        markdown.Should().Contain("## Added Services");
        markdown.Should().Contain("## Added Relationships");
        markdown.Should().NotContain("## Warnings");

        int noneCount = markdown.Split("- None").Length - 1;
        noneCount.Should().Be(8);
    }

    [Fact]
    public void MarkdownEvidenceSummaryFormatter_FormatMarkdown_omits_optional_sections_for_minimal_evidence()
    {
        MarkdownEvidenceSummaryFormatter sut = new();
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Minimal",
            Environment = "prod",
            CloudProvider = "Azure",
            Request = new RequestEvidence { Description = "Minimal request." },
        };

        string markdown = sut.FormatMarkdown(evidence);

        markdown.Should().Contain("Minimal");
        markdown.Should().NotContain("### Constraints");
        markdown.Should().NotContain("### Required Capabilities");
        markdown.Should().NotContain("### Assumptions");
        markdown.Should().NotContain("### Policy Evidence");
        markdown.Should().NotContain("### Service Catalog Hints");
        markdown.Should().NotContain("### Pattern Hints");
        markdown.Should().NotContain("### Prior Manifest Context");
        markdown.Should().NotContain("### Evidence Notes");
    }

    [Fact]
    public void MarkdownEndToEndReplayComparisonSummaryFormatter_FormatMarkdown_emits_none_placeholders_when_diffs_absent()
    {
        MarkdownEndToEndReplayComparisonSummaryFormatter sut = new();
        EndToEndReplayComparisonReport report = new() { LeftRunId = "left", RightRunId = "right" };

        string markdown = sut.FormatMarkdown(report);

        markdown.Should().Contain("# End-to-End Replay Comparison: left -> right");
        markdown.Should().Contain("## Run Metadata Changes");
        markdown.Should().NotContain("## Agents With Material Changes");
        markdown.Should().NotContain("## Manifest Added Services");
        markdown.Should().NotContain("## Export Diff Summary");
        markdown.Should().Contain("## Interpretation Notes");
        markdown.Should().Contain("## Warnings");
    }

    private static string ExtractBodyText(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart!.Document.Body!.InnerText;
    }
}
