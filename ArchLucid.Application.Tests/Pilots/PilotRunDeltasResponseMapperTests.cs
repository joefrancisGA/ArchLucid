using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public class PilotRunDeltasResponseMapperTests
{
    [Fact]
    public void ToResponseWithProofPackage_MapsExtractorCollectionTimestampUtc()
    {
        ArchitectureRun run = new()
        {
            RunId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        DateTime ts = DateTime.UtcNow;
        GoldenManifest manifest = new()
        {
            Metadata = new Dictionary<string, string>
            {
                { "azureExtractorCollectionTimestampUtc", ts.ToString("O") }
            }
        };

        PilotRunDeltas deltas = new()
        {
            RunCreatedUtc = DateTime.UtcNow
        };

        ValueReportSnapshot valueReport = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunsInPeriod = 1
        };

        PilotRunDeltasResponse response = PilotRunDeltasResponseMapper.ToResponseWithProofPackage(run, manifest, deltas, valueReport);

        response.ExtractorCollectionTimestampUtc.Should().Be(ts);
    }
}
