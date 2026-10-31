using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackFirstValueRunIdentityMarkdownTests
{
    [Fact]
    public void Run_identity_section_when_system_name_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportRunSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRun
            {
                RunId = "run-1",
                Status = ArchitectureRunStatus.Committed,
                RequestId = "req-1",
                CreatedUtc = DateTime.UtcNow,
            },
            new GoldenManifest
            {
                SystemName = "Pay|ments",
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
                Governance = new ManifestGovernance(),
            },
            "https://app.example");

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| System |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| System | `Pay\\|ments` |");
    }

    [Fact]
    public void Run_identity_section_when_support_run_id_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportRunSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRun
            {
                RunId = "run|support",
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = DateTime.UtcNow,
            },
            manifest: null,
            "https://app.example");

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Support run id |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Support run id | `run\\|support` |");
    }

    [Fact]
    public void Run_identity_section_when_request_id_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportRunSectionFormatter.AppendMarkdownSection(
            sb,
            new ArchitectureRun
            {
                RunId = "run-1",
                Status = ArchitectureRunStatus.Committed,
                RequestId = "req`trace",
                CreatedUtc = DateTime.UtcNow,
            },
            manifest: null,
            "https://app.example");

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Request id |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Request id | ``req`trace`` |");
    }
}
