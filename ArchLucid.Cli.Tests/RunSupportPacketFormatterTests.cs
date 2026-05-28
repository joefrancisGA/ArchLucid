using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

/// <summary>Unit tests for <see cref="RunSupportPacketFormatter"/> — deterministic formatting without HTTP.</summary>
[Trait("Category", "Unit")]
public sealed class RunSupportPacketFormatterTests
{
    [Fact]
    public void ResolveNextStep_when_manifest_present_prioritizes_sponsor_attachment_hint()
    {
        RunSupportPacketFormatter.ResolveNextStep(ArchitectureRunStatus.WaitingForResults, "mv-1")
            .Should()
            .Contain("Committed")
            .And.Contain("first-value-report");
    }

    [Fact]
    public void ResolveNextStep_ready_for_commit_mentions_commit()
    {
        RunSupportPacketFormatter.ResolveNextStep(ArchitectureRunStatus.ReadyForCommit, null)
            .Should()
            .Contain("commit");
    }

    [Fact]
    public void ResolveNextStep_default_branch_mentions_authority_inspection()
    {
        RunSupportPacketFormatter.ResolveNextStep(ArchitectureRunStatus.Committed, null)
            .Should()
            .Contain("GET /v1/architecture/run");
    }

    [Fact]
    public void ResolveNextStep_waiting_for_results_mentions_legacy_coordinator()
    {
        RunSupportPacketFormatter.ResolveNextStep(ArchitectureRunStatus.WaitingForResults, null)
            .Should()
            .Contain("Legacy coordinator");
    }

    [Fact]
    public void FormatPlainText_includes_trace_and_manifest_projection_lines()
    {
        ArchLucidApiClient.GetRunResult detail =
            new()
            {
                Run = new ArchLucidApiClient.RunInfo
                {
                    RunId = "rid",
                    RequestId = "req",
                    Status = ArchitectureRunStatus.Committed,
                    CreatedUtc = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc),
                    CompletedUtc = new DateTime(2026, 5, 1, 12, 30, 0, DateTimeKind.Utc),
                    CurrentManifestVersion = "1.9.0",
                    OtelTraceId = "abc123",
                    RealModeFellBackToSimulator = false
                },
                Results = [new object()]
            };

        string text = RunSupportPacketFormatter.FormatPlainText("http://localhost:5128/", """{"gitSha":"deadbeef"}""", detail);

        text.Should().Contain("Run id: rid");
        text.Should().Contain("Manifest version: 1.9.0");
        text.Should().Contain("OpenTelemetry trace id: abc123");
        text.Should().Contain("Submitted agent results (count): 1");
        text.Should().Contain("GET http://localhost:5128/v1/architecture/run/rid");
        text.Should().Contain("\"gitSha\":\"deadbeef\"");
    }
}
