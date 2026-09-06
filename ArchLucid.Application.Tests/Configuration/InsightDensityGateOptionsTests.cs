using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class InsightDensityGateOptionsTests
{
    [Fact]
    public void Default_max_judged_findings_per_snapshot_is_forty()
    {
        InsightDensityGateOptions options = new();

        options.MaxJudgedFindingsPerSnapshot.Should().Be(40);
    }
}
