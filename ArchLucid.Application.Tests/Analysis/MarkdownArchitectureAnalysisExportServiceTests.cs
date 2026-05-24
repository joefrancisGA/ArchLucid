using ArchLucid.Application.Analysis;
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

        int fences = md.Split("```", StringSplitOptions.None).Length - 1;
        fences.Should().Be(6, "three fenced blocks per trace (text/text/json) => six fences total");
        md.Should().Contain("```text");
        md.Should().Contain("```json");
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
    public void GenerateMarkdown_evidence_with_empty_nested_lists_skips_optional_bullets()
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
        md.Should().NotContain("- Constraints:");
    }
}
