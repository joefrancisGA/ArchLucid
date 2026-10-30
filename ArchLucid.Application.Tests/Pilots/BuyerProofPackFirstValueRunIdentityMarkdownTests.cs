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
}
