using ArchLucid.Application.Governance;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class CachingExecutiveRoiSummaryServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task BuildAsync_overwrites_cached_governance_kpis_with_live_waiver_and_stale_counts()
    {
        DateTimeOffset nowUtc = DateTimeOffset.UtcNow;
        ExecutiveRoiSummaryResponse staleCached = new()
        {
            ExpiringWaiversCount14Days = 99,
            StaleArchitectureRiskCount = 88,
        };

        Mock<IHotPathReadCache> cache = new();
        cache
            .Setup(c => c.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, Task<ExecutiveRoiSummaryResponse>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int>()))
            .ReturnsAsync(staleCached);

        Mock<IExecutiveRoiSummaryService> inner = new();
        inner
            .Setup(service => service.BuildAsync(It.IsAny<CancellationToken>()))
            .Throws(new InvalidOperationException("Inner must not run when cache returns payload."));

        Mock<IRiskExceptionService> riskExceptions = new();
        riskExceptions
            .Setup(service => service.ListActiveAsync(TenantId, ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = TenantId,
                    ProjectId = ProjectId,
                    ExpiresAtUtc = nowUtc.AddDays(7),
                    Status = RiskExceptionStatus.Active,
                },
                new RiskExceptionRecord
                {
                    RiskExceptionId = Guid.NewGuid(),
                    TenantId = TenantId,
                    ProjectId = ProjectId,
                    ExpiresAtUtc = nowUtc.AddDays(30),
                    Status = RiskExceptionStatus.Active,
                },
            ]);

        Mock<IArchitectureRiskRegisterService> register = new();
        register
            .Setup(service => service.GetRegisterAsync(TenantId, ProjectId, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ArchitectureRiskRegisterResponse
                {
                    Entries =
                    [
                        new ArchitectureRiskRegisterEntry { IsStale = true },
                        new ArchitectureRiskRegisterEntry { IsStale = true },
                        new ArchitectureRiskRegisterEntry { IsStale = false },
                    ],
                });

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(provider => provider.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
            });

        Mock<IOptionsMonitor<ExecutiveRoiCacheWarmupOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new ExecutiveRoiCacheWarmupOptions { CacheTtlSeconds = 300 });

        CachingExecutiveRoiSummaryService sut = new(
            inner.Object,
            riskExceptions.Object,
            register.Object,
            cache.Object,
            scope.Object,
            options.Object);

        ExecutiveRoiSummaryResponse result = await sut.BuildAsync(CancellationToken.None);

        result.ExpiringWaiversCount14Days.Should().Be(1);
        result.StaleArchitectureRiskCount.Should().Be(2);
    }
}
