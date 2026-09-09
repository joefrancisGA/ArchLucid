using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Roi;

internal static class RoiControllerTestSupport
{
    internal static SponsorRoiRunCollector CreateRunCollector(IScopeContextProvider? scopeProvider = null) =>
        new(
            Mock.Of<IRunDetailQueryService>(),
            Mock.Of<ITenantEstimatedUsdSavingsResolver>(),
            scopeProvider ?? Mock.Of<IScopeContextProvider>(),
            Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IRiskExceptionService>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<ITenantCostSettingsRepository>(),
            Options.Create(new ValueReportComputationOptions()),
            NullLogger<SponsorRoiRunCollector>.Instance);
}
