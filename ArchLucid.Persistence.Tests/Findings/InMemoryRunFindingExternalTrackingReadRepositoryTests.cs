using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class InMemoryRunFindingExternalTrackingReadRepositoryTests
{
    [Fact]
    public async Task ListForFindings_orders_linked_ticket_summary_by_creation_time()
    {
        Guid tenantId = Guid.NewGuid();
        DateTime earlier = new(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(repository => repository.ListByFindingAsync(
                tenantId,
                "finding-1",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IReadOnlyList<ItsmFindingCorrelationRecord>)
            [
                new()
                {
                    TenantId = tenantId,
                    FindingId = "finding-1",
                    Provider = "later-provider",
                    ExternalKey = "LATER-2",
                    CreatedUtc = earlier.AddMinutes(1),
                },
                new()
                {
                    TenantId = tenantId,
                    FindingId = "finding-1",
                    Provider = "earlier-provider",
                    ExternalKey = "EARLIER-1",
                    CreatedUtc = earlier,
                },
            ]);

        InMemoryRunFindingExternalTrackingReadRepository repository = new(correlations.Object);

        IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow> result =
            await repository.ListForFindingsAsync(
                tenantId,
                findingsSnapshotId: null,
                ["finding-1"],
                CancellationToken.None);

        RunFindingExternalTrackingReadRow row = result["finding-1"];
        row.Provider.Should().Be("earlier-provider");
        row.ItsmLinkedTicketsSummary.Should().Be("earlier-provider:EARLIER-1; later-provider:LATER-2");
    }
}
