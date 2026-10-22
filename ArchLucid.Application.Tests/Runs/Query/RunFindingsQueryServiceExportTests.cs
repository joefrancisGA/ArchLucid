using ArchLucid.Application;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Runs.Query.Stages;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Runs.Query;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunFindingsQueryServiceExportTests
{
    [Fact]
    public async Task ExportRunFindingsCsvAsync_returns_conflict_when_run_not_committed()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                Status = ArchitectureRunStatus.ReadyForCommit
            },
            Manifest = null
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(x => x.GetRunDetailForOperatorEnrichAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        RunFindingsQueryService sut = CreateSut(runDetails.Object);

        RunFindingsCsvExportQueryResult result =
            await sut.ExportRunFindingsCsvAsync(runId, CancellationToken.None);

        result.Outcome.Should().Be(RunFindingsQueryOutcome.Conflict);
        result.ProblemDetail.Should().Contain("finalized review");
        result.CsvBytes.Should().BeNull();
    }

    private static RunFindingsQueryService CreateSut(IRunDetailQueryService runDetailQueryService)
    {
        Mock<IRunFindingExternalTrackingReadRepository> trackingRead = new();
        trackingRead
            .Setup(r => r.ListForFindingsAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, RunFindingExternalTrackingReadRow>());

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        return new RunFindingsQueryService(
            new RunFindingsListStage(
                Mock.Of<IRunRepository>(),
                Mock.Of<IFindingsSnapshotRepository>(),
                new RunFindingExternalTrackingEnrichmentService(
                    trackingRead.Object,
                    UrlBuilder(new IntegrationsItsmOutboundOptions
                    {
                        Jira = new JiraItsmOutboundOptions { CloudBaseUrl = "https://example.atlassian.net" }
                    })),
                scopeProvider.Object),
            new RunFindingsCsvExportStage(
                runDetailQueryService,
                Mock.Of<IRunRepository>(),
                new RunFindingExternalTrackingEnrichmentService(
                    trackingRead.Object,
                    UrlBuilder(new IntegrationsItsmOutboundOptions
                    {
                        Jira = new JiraItsmOutboundOptions { CloudBaseUrl = "https://example.atlassian.net" }
                    })),
                scopeProvider.Object,
                Mock.Of<IAuthorityQueryService>(),
                Mock.Of<IManifestHashService>(),
                new ExportFormatterService()),
            new RunFindingsInspectStage(
                Mock.Of<IRunRepository>(),
                Mock.Of<ArchLucid.Persistence.Interfaces.IFindingInspectReadRepository>(),
                Mock.Of<IFindingTrustLabelMapper>(),
                Mock.Of<IReasoningSummaryBuilder>(),
                scopeProvider.Object,
                Mock.Of<IAuthorityQueryService>()),
            Mock.Of<IRunRepository>(),
            Mock.Of<ArchLucid.Application.Explanation.IFindingEvidenceChainService>(),
            scopeProvider.Object);
    }
}
