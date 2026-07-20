using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WorkspacePackagingLimitEvaluatorTests
{
    [Fact]
    public void EvaluateSelfServeOrganizationCreate_allows_when_no_memberships()
    {
        WorkspacePackagingLimitEvaluator sut = CreateSut();

        WorkspacePackagingLimitEvaluation result = sut.EvaluateSelfServeOrganizationCreate(0);

        result.Allowed.Should().BeTrue();
    }

    [Fact]
    public void EvaluateSelfServeOrganizationCreate_denies_when_at_free_limit()
    {
        WorkspacePackagingLimitEvaluator sut = CreateSut();

        WorkspacePackagingLimitEvaluation result = sut.EvaluateSelfServeOrganizationCreate(1);

        result.Allowed.Should().BeFalse();
        result.DenyReasonCode.Should().Be("workspace_packaging_limit");
        result.CustomerMessage.Should().Be(WorkspacePackagingLimitEvaluator.SelfServeLimitCustomerMessage);
    }

    [Fact]
    public async Task EvaluateAdditionalWorkspaceForTenantAsync_denies_when_team_at_limit()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<ITenantUsageStatusService> usage = new();
        usage.Setup(service => service.BuildAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantUsageStatusSnapshot(
                    IsTrial: false,
                    CommercialTier: CommercialPackagingTierLabels.Team,
                    SeatsUsed: 1,
                    SeatsLimit: CommercialPackagingLimits.TeamSeatsIncluded,
                    WorkspacesUsed: 1,
                    WorkspacesLimit: CommercialPackagingLimits.TeamWorkspacesIncluded));

        WorkspacePackagingLimitEvaluator sut = new(usage.Object);

        WorkspacePackagingLimitEvaluation result =
            await sut.EvaluateAdditionalWorkspaceForTenantAsync(tenantId, CancellationToken.None);

        result.Allowed.Should().BeFalse();
        result.CustomerMessage.Should().Be(WorkspacePackagingLimitEvaluator.TenantLimitCustomerMessage);
    }

    [Fact]
    public async Task EvaluateAdditionalWorkspaceForTenantAsync_allows_when_under_limit()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Mock<ITenantUsageStatusService> usage = new();
        usage.Setup(service => service.BuildAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantUsageStatusSnapshot(
                    IsTrial: false,
                    CommercialTier: CommercialPackagingTierLabels.Professional,
                    SeatsUsed: 2,
                    SeatsLimit: CommercialPackagingLimits.ProfessionalSeatsIncluded,
                    WorkspacesUsed: 1,
                    WorkspacesLimit: CommercialPackagingLimits.ProfessionalWorkspacesIncluded));

        WorkspacePackagingLimitEvaluator sut = new(usage.Object);

        WorkspacePackagingLimitEvaluation result =
            await sut.EvaluateAdditionalWorkspaceForTenantAsync(tenantId, CancellationToken.None);

        result.Allowed.Should().BeTrue();
    }

    private static WorkspacePackagingLimitEvaluator CreateSut() =>
        new(Mock.Of<ITenantUsageStatusService>());
}
