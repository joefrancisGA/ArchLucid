using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

internal static class RoiControllerTestSupport
{
    internal static ISponsorRoiSummaryService CreateEmptySummaryService()
    {
        Mock<ISponsorRoiSummaryService> summaryService = new();
        summaryService
            .Setup(service => service.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorRoiSummaryResponse());

        return summaryService.Object;
    }

    internal static SponsorRoiRunCollector CreateRunCollector(ScopeContext? scope = null)
    {
        ScopeContext resolvedScope = scope ?? new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(resolvedScope);

        return new SponsorRoiRunCollector(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            scopeProvider.Object,
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IRiskExceptionService>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<ITenantCostSettingsRepository>(),
            Options.Create(new ValueReportComputationOptions()),
            NullLogger<SponsorRoiRunCollector>.Instance);
    }
}
