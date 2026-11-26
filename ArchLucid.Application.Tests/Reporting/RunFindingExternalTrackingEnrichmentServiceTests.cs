using System.Reflection;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunFindingExternalTrackingEnrichmentServiceTests
{
    [Fact]
    public async Task LoadForFindingsAsync_maps_rows_and_builds_external_url()
    {
        Mock<IRunFindingExternalTrackingReadRepository> readRepository = new();

        readRepository
            .Setup(repo => repo.ListForFindingsAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, RunFindingExternalTrackingReadRow>(StringComparer.Ordinal)
            {
                ["finding-1"] = new RunFindingExternalTrackingReadRow
                {
                    FindingId = "finding-1",
                    HumanReviewStatus = "Pending",
                    Disposition = "Deferred",
                    RevisitDueUtc = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                    Provider = "Jira",
                    ExternalKey = "ABC-1",
                    ExternalSysId = "sys-1",
                    ItsmLinkedTicketsSummary = "Jira:ABC-1"
                }
            });

        RunFindingExternalTrackingEnrichmentService sut = new(
            readRepository.Object,
            UrlBuilder(new IntegrationsItsmOutboundOptions
            {
                Jira = new JiraItsmOutboundOptions { CloudBaseUrl = "https://example.atlassian.net" }
            }));

        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection> result =
            await sut.LoadForFindingsAsync(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                findingsSnapshotId: null,
                ["finding-1"],
                CancellationToken.None);

        RunFindingExternalTrackingProjection projection = result["finding-1"];
        projection.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.Pending);
        projection.LatestDisposition.Should().Be(FindingDisposition.Deferred);
        projection.ExternalUrl.Should().Be("https://example.atlassian.net/browse/ABC-1");
        projection.TrackedExternally.Should().BeTrue();
        projection.ExternalTrackingSummary.Should().Be("Jira:ABC-1");
    }
}
