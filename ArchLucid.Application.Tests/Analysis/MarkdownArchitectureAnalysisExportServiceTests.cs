using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
///     Validates markdown structure for <see cref="MarkdownArchitectureAnalysisExportService" /> so exported reports stay
///     machine- and human-safe (balanced fences, predictable headings).
/// </summary>
[Trait("Category", "Unit")]
public sealed class MarkdownArchitectureAnalysisExportServiceTests
{
    private readonly MarkdownArchitectureAnalysisExportService _sut = new();

    [Fact]
    public void GenerateMarkdown_null_report_throws()
    {
        Action act = () => _sut.GenerateMarkdown(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void GenerateMarkdown_minimal_run_only_has_title_and_run_section()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                }
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().StartWith("# ArchLucid Analysis Report");
        md.Should().Contain("## Agent Execution Traces");
        md.Should().Contain("No execution traces");
        md.Should().NotContain("```");
    }

    [Fact]
    public void GenerateMarkdown_trace_section_balances_code_fences_when_prompts_empty()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            ExecutionTraces =
            [
                new AgentExecutionTrace
                {
                    AgentType = AgentType.Topology,
                    TaskId = "11111111111111111111111111111111",
                    TraceId = "22222222222222222222222222222222",
                    SystemPrompt = string.Empty,
                    UserPrompt = string.Empty,
                    RawResponse = string.Empty,
                    ParseSucceeded = true,
                    CreatedUtc = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            ]
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceSystemPromptStoredEmptyCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceUserPromptStoredEmptyCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceRawResponseStoredEmptyCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.ParsedResultNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.TraceErrorNotStoredCopy);
        md.Should().NotContain("```text");
    }

    [Fact]
    public void GenerateMarkdown_trace_error_line_uses_stored_empty_copy_when_blank()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            ExecutionTraces =
            [
                new AgentExecutionTrace
                {
                    AgentType = AgentType.Topology,
                    TaskId = "11111111111111111111111111111111",
                    TraceId = "22222222222222222222222222222222",
                    ErrorMessage = "   ",
                    ParseSucceeded = false,
                    CreatedUtc = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            ]
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain($"- Error: {ArchitectureEvidenceRequestExport.TraceErrorStoredEmptyCopy}");
    }

    [Fact]
    public void GenerateMarkdown_manifest_and_warnings_render_without_malformed_lists()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            Warnings = ["First warning", "Second warning"],
            Manifest =
                new GoldenManifest
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    SystemName = "Acme",
                    Metadata = new ManifestMetadata { ManifestVersion = "v2" },
                    Services =
                    [
                        new ManifestService
                        {
                            ServiceName = "api",
                            ServiceType = ServiceType.Api,
                            RuntimePlatform = RuntimePlatform.AppService
                        }
                    ]
                },
            Diagram = "graph TD\n  A-->B",
            Summary = "  Trimmed summary line  "
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain("## Report Warnings");
        md.Should().Contain("- First warning");
        md.Should().Contain("## Architecture Manifest");
        md.Should().Contain("- **api**");
        md.Should().Contain("```mermaid");
        md.Should().Contain("graph TD");
        md.Should().Contain("## Architecture Summary");
        md.Should().Contain("Trimmed summary line");
    }

    [Fact]
    public void GenerateMarkdown_manifest_diff_includes_relationship_subsections_when_populated()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships =
                [
                    new RelationshipDiffItem
                    {
                        SourceId = "api",
                        TargetId = "db",
                        RelationshipType = "reads"
                    }
                ]
            }
        };

        string markdown = _sut.GenerateMarkdown(report);

        markdown.Should().Contain("#### Added Relationships");
        markdown.Should().Contain("api -> db (reads)");
    }

    [Fact]
    public void GenerateMarkdown_includes_governance_classifications_when_control_lists_empty()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            Manifest =
                new GoldenManifest
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    SystemName = "Acme",
                    Metadata = new ManifestMetadata { ManifestVersion = "v1" },
                    Governance = new ManifestGovernance
                    {
                        RiskClassification = "High",
                        CostClassification = "Low",
                    },
                },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain("### Governance");
        md.Should().Contain("Risk Classification: High");
        md.Should().Contain("Cost Classification: Low");
        md.Should().Contain(ArchitectureManifestGovernanceExport.RequiredControlsNotStoredLabel);
        md.Should().Contain(ArchitectureManifestGovernanceExport.ComplianceTagsNotStoredLabel);
        md.Should().Contain(ArchitectureManifestGovernanceExport.PolicyConstraintsNotStoredLabel);
    }

    [Fact]
    public void GenerateMarkdown_evidence_with_empty_nested_lists_states_not_recorded_copy()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed
                },
            Evidence =
                new AgentEvidencePackage
                {
                    EvidencePackageId = "ev-1",
                    SystemName = "Sys",
                    Environment = "prod",
                    CloudProvider = "Azure",
                    Request = new RequestEvidence { Description = "At least ten characters for export body." }
                }
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain("## Evidence Package");
        md.Should().Contain("At least ten characters for export body.");
        md.Should().Contain($"- Constraints: {ArchitectureEvidenceRequestExport.ConstraintsNotRecordedCopy}");
        md.Should().Contain(ArchitectureEvidenceRequestExport.RequiredCapabilitiesNotRecordedCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.AssumptionsNotRecordedCopy);
    }

    [Fact]
    public void GenerateMarkdown_null_evidence_states_package_not_stored()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "a1b2c3d4e5f678901234567890abcd",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain("## Evidence Package");
        md.Should().Contain(ArchitectureEvidenceRequestExport.MissingEvidencePackageCopy);
    }

    [Fact]
    public void GenerateMarkdown_reports_omission_copy_for_missing_evidence_identity_and_summary_sections()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "a1b2c3d4e5f678901234567890abcd",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.MissingEvidencePackageCopy);
        md.Should().Contain($"- Completed UTC: {ArchitectureEvidenceRequestExport.MissingCompletedTimeCopy}");
        md.Should().Contain("## Diagram");
        md.Should().Contain(ConsultingDocxAppendixHonestyCopy.MermaidSourceNotStored);
        md.Should().Contain("## Architecture Summary");
        md.Should().Contain(ArchitectureEvidenceRequestExport.ArchitectureSummaryNotStoredCopy);
    }

    [Fact]
    public void GenerateMarkdown_evidence_identity_fields_use_not_stored_copy_when_blank()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "a1b2c3d4e5f678901234567890abcd",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            Evidence = new AgentEvidencePackage
            {
                Request = new RequestEvidence { Description = "At least ten characters for export body." },
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.MissingSystemNameCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.MissingEnvironmentCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.MissingCloudProviderCopy);
    }

    [Fact]
    public void GenerateMarkdown_uses_summary_omission_copy_for_empty_policy_catalog_and_pattern_summaries()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "a1b2c3d4e5f678901234567890abcd",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
                CompletedUtc = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
            },
            Evidence = new AgentEvidencePackage
            {
                EvidencePackageId = "ev-1",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = "At least ten characters for export body." },
                Policies = [new PolicyEvidence { Title = "Pack", PolicyId = "p-1", Summary = "" }],
                ServiceCatalog =
                [
                    new ServiceCatalogEvidence { ServiceName = "API", Category = "compute", Summary = null! },
                ],
                Patterns = [new PatternEvidence { Name = "Web", PatternId = "pat-1", Summary = "  " }],
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain(ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.ServiceCatalogSummaryNotStoredCopy);
        md.Should().Contain(ArchitectureEvidenceRequestExport.PatternSummaryNotStoredCopy);
    }

    [Fact]
    public void GenerateMarkdown_labels_missing_manifest_with_committed_manifest_honesty()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "a1b2c3d4e5f678901234567890abcd",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain("## Architecture Manifest");
        md.Should().Contain(ConsultingDocxExportHonestyCopy.CommittedManifestNotStored);
    }

    [Fact]
    public void GenerateMarkdown_uses_omission_copy_for_missing_evidence_description()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "a1b2c3d4e5f678901234567890abcd",
                RequestId = "req-1",
                Status = ArchitectureRunStatus.Committed,
            },
            Evidence = new AgentEvidencePackage
            {
                EvidencePackageId = "ev-1",
                SystemName = "Sys",
                Environment = "prod",
                CloudProvider = "Azure",
                Request = new RequestEvidence { Description = null! },
            },
        };

        string md = _sut.GenerateMarkdown(report);

        md.Should().Contain($"- Description: {ArchitectureEvidenceRequestExport.MissingDescriptionCopy}");
    }

    [Fact]
    public void GenerateMarkdown_emits_not_stored_copy_for_missing_compare_artifacts()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run =
                new ArchitectureRun
                {
                    RunId = "a1b2c3d4e5f678901234567890abcd",
                    RequestId = "req-1",
                    Status = ArchitectureRunStatus.Committed,
                },
            ManifestDiff = new ManifestDiffResult { AddedServices = ["api"] },
        };

        string markdown = _sut.GenerateMarkdown(report);

        markdown.Should().Contain(ConsultingDocxAppendixHonestyCopy.DeterminismCheckNotStored);
        markdown.Should().Contain(ConsultingDocxAppendixHonestyCopy.AgentResultDiffNotStored);
        markdown.Should().Contain("Added Services");
    }
}
