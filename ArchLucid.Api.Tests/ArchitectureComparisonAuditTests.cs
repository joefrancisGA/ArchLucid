using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Comparison Audit.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureComparisonAuditTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task EndToEndComparisonSummary_PersistsComparisonRecord()
    {
        CommittedReplayPair pair = await ArrangeCommittedPairAsync(nameof(ArchitectureComparisonAuditTests));
        PersistedComparison persisted = await Replay.PersistEndToEndComparisonAsync(pair.RunId, pair.ReplayRunId);

        ComparisonRecordResponseDto payload = await (
            await Client.GetAsync(
                $"/v1/architecture/comparisons/{Uri.EscapeDataString(persisted.ComparisonRecordId)}"))
            .ReadJsonForTestAsync<ComparisonRecordResponseDto>(JsonOptions);

        payload.Record.ComparisonType.Should().Be("end-to-end-replay");
        payload.Record.LeftRunId.Should().Be(pair.RunId);
        payload.Record.RightRunId.Should().Be(pair.ReplayRunId);
        payload.Record.SummaryMarkdown.Should().NotBeNullOrWhiteSpace();
        payload.Record.PayloadJson.Should().NotBeNullOrWhiteSpace();
    }
}
