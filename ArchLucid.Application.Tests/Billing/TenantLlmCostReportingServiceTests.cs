using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class TenantLlmCostReportingServiceTests
{
    [SkippableFact]
    public async Task BuildDashboardAsync_uses_workspace_display_name_not_tenant_name_in_breakdown()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        InMemoryLlmTenantBudgetRepository budgetRepository = new();
        LlmTenantBudgetStateReadModel monthState = await budgetRepository.GetOrCreateAsync(
            tenantId,
            LlmBudgetPeriod.Monthly,
            "2026-08",
            CancellationToken.None);
        await budgetRepository.SettleAsync(
            new LlmTenantBudgetSettleRequest
            {
                TenantId = tenantId,
                Period = LlmBudgetPeriod.Monthly,
                PeriodKey = "2026-08",
                ActualUsd = 30m,
                ReleaseReservedUsd = 0m,
                WarnAtUsd = 999_999m,
                ExpectedRowVersion = monthState.RowVersion,
            },
            CancellationToken.None);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, Name = "Acme Tenant" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = workspaceId,
                    TenantId = tenantId,
                    Name = "Platform Workspace",
                    DefaultProjectId = projectId,
                },
            ]);

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> budgetOptions = new();
        budgetOptions.Setup(monitor => monitor.CurrentValue).Returns(new LlmMonthlyTenantDollarBudgetOptions
        {
            Enabled = true,
            HardCutoffUsdPerUtcMonth = 100m,
        });

        Mock<ITenantLlmCostTopRunRanker> topRuns = new();
        topRuns
            .Setup(ranker => ranker.RankAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<LlmCostTopRunRowResponse>());

        TenantLlmCostReportingService sut = new(
            new FixedUtcTimeProvider(new DateTime(2026, 8, 23, 12, 0, 0, DateTimeKind.Utc)),
            scopeProvider.Object,
            budgetRepository,
            tenants.Object,
            budgetOptions.Object,
            topRuns.Object);

        LlmCostReportingDashboardResponse result = await sut.BuildDashboardAsync(days: 7);

        LlmCostWorkspaceProjectRowResponse row = result.ByWorkspaceProject.Should().ContainSingle().Subject;
        row.WorkspaceId.Should().Be(workspaceId);
        row.WorkspaceName.Should().Be("Platform Workspace");
    }

    private sealed class FixedUtcTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow, TimeSpan.Zero);
    }
}
