using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CloudResourceExplorerWorkQueueParserTests
{
    [Theory]
    [InlineData(null, CloudResourceExplorerWorkQueue.All)]
    [InlineData("", CloudResourceExplorerWorkQueue.All)]
    [InlineData("   ", CloudResourceExplorerWorkQueue.All)]
    [InlineData("open-findings", CloudResourceExplorerWorkQueue.OpenFindings)]
    [InlineData("OPEN-FINDINGS", CloudResourceExplorerWorkQueue.OpenFindings)]
    [InlineData("open-remediation", CloudResourceExplorerWorkQueue.OpenRemediation)]
    [InlineData("recent-drift", CloudResourceExplorerWorkQueue.RecentDrift)]
    [InlineData("unknown", CloudResourceExplorerWorkQueue.All)]
    public void Parse_maps_known_work_queue_tokens(string? raw, CloudResourceExplorerWorkQueue expected)
    {
        CloudResourceExplorerWorkQueue result = CloudResourceExplorerWorkQueueParser.Parse(raw);

        result.Should().Be(expected);
    }
}
