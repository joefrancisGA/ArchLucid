using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class MarkdownArchitectureAnalysisExportEvidenceHonestyTests
{
    private readonly MarkdownArchitectureAnalysisExportService _sut = new();

    [Fact]
    public void GenerateMarkdown_policy_catalog_and_pattern_sections_use_not_recorded_copy_when_empty()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            Evidence = new AgentEvidencePackage
            {
                EvidencePackageId = "ev-1",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = "At least ten characters for export body." },
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain("### Policy Evidence");
        md.Should().Contain(ArchitectureEvidenceRequestExport.NoPolicyEvidenceRowsStoredCopy);
        md.Should().Contain("### Service Catalog Hints");
        md.Should().Contain(ArchitectureEvidenceRequestExport.NoServiceCatalogRowsStoredCopy);
        md.Should().Contain("### Pattern Hints");
        md.Should().Contain(ArchitectureEvidenceRequestExport.NoPatternRowsStoredCopy);
    }

    [Fact]
    public void GenerateMarkdown_policy_identity_and_required_controls_use_honesty_copy()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            Evidence = new AgentEvidencePackage
            {
                EvidencePackageId = "ev-1",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = "At least ten characters for export body." },
                Policies =
                [
                    new PolicyEvidence
                    {
                        Title = "",
                        PolicyId = "  ",
                        Summary = "Policy summary line.",
                        RequiredControls = [],
                    },
                ],
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.PolicyTitleNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.PolicyIdNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.RequiredControlsNotStoredCopy);
    }

    [Fact]
    public void GenerateMarkdown_service_catalog_and_pattern_identity_fields_use_honesty_copy()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            Evidence = new AgentEvidencePackage
            {
                EvidencePackageId = "ev-1",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = "At least ten characters for export body." },
                ServiceCatalog = [new ServiceCatalogEvidence { ServiceName = " ", Category = "", Summary = "ok" }],
                Patterns = [new PatternEvidence { Name = "", PatternId = "", Summary = "ok" }],
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.ServiceNameNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.ServiceCategoryNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.PatternNameNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.PatternIdNotStoredCopy);
    }

    [Fact]
    public void GenerateMarkdown_trace_prompts_use_stored_empty_copy_for_blank_fields()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            ExecutionTraces =
            [
                new AgentExecutionTrace
                {
                    AgentType = AgentType.Topology,
                    TaskId = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                    TraceId = "cccccccccccccccccccccccccccccccc",
                    SystemPrompt = "   ",
                    UserPrompt = string.Empty,
                    RawResponse = "  ",
                    ParseSucceeded = true,
                    CreatedUtc = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                },
            ],
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceSystemPromptStoredEmptyCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceUserPromptStoredEmptyCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceRawResponseStoredEmptyCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceParsedResultNotStoredCopy);
    }

    [Fact]
    public void GenerateMarkdown_header_and_trace_fields_use_omission_copy_when_missing()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                RequestId = "  ",
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = null,
            },
            Evidence = new AgentEvidencePackage
            {
                EvidencePackageId = "ev-1",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = "At least ten characters for export body." },
                ServiceCatalog =
                [
                    new ServiceCatalogEvidence
                    {
                        ServiceName = "Storage",
                        Category = "Data",
                        Summary = "ok",
                        RecommendedUseCases = [],
                    },
                ],
            },
            ExecutionTraces =
            [
                new AgentExecutionTrace
                {
                    AgentType = AgentType.Topology,
                    TaskId = "",
                    TraceId = "cccccccccccccccccccccccccccccccc",
                    ParseSucceeded = false,
                    CreatedUtc = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                },
            ],
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ConsultingDocxExportHonestyCopy.RequestIdNotStored);
        md.Should().Contain(ArchitectureEvidenceRequestExport.CurrentManifestVersionNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceTaskIdNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.RecommendedUseCasesNotStoredCopy);
    }
}
