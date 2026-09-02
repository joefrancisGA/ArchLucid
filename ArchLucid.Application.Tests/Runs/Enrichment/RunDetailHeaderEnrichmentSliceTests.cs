using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Enrichment;

[Trait("Suite", "Application")]
public sealed class RunDetailHeaderEnrichmentSliceTests
{
    [Fact]
    public async Task EnrichAsync_sets_dead_letter_and_engine_provenance()
    {
        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = Guid.NewGuid(),
                EngineProvenanceJson = """{"pipeline":"test"}""",
                LastFailureReason = """{"code":"agent-timeout"}""",
            },
        };

        RunDetailHeaderEnrichmentSlice slice = new();
        await slice.EnrichAsync(new RunDetailEnrichmentContext { Detail = detail }, CancellationToken.None);

        detail.EngineProvenance.Should().NotBeNull();
        detail.LastAgentExecutionFailure.Should().NotBeNull();
    }
}
