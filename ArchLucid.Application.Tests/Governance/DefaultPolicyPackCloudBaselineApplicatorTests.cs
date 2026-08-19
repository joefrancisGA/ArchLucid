using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class DefaultPolicyPackCloudBaselineApplicatorTests
{
    [Fact]
    public async Task TryApplyAsync_aws_enables_aws_baselines_without_disabling_existing_selections()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        InMemoryPolicyPackRepository packs = new();
        InMemoryPolicyPackAssignmentRepository assignments = new();

        Guid azureWafPackId = await SeedPlatformPackAsync(
            packs,
            assignments,
            tenantId,
            workspaceId,
            projectId,
            DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName,
            isEnabled: true);

        Guid awsWafPackId = await SeedPlatformPackAsync(
            packs,
            assignments,
            tenantId,
            workspaceId,
            projectId,
            DefaultPolicyPackCatalog.AwsWellArchitectedDisplayName,
            isEnabled: false);

        DefaultPolicyPackCloudBaselineApplicator sut = new(
            packs,
            assignments,
            NullLogger<DefaultPolicyPackCloudBaselineApplicator>.Instance);

        await sut.TryApplyAsync(tenantId, workspaceId, projectId, CloudProvider.Aws, CancellationToken.None);

        IReadOnlyList<PolicyPackAssignment> updated =
            await assignments.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        FindAssignment(updated, azureWafPackId).IsEnabled.Should().BeTrue();
        FindAssignment(updated, awsWafPackId).IsEnabled.Should().BeTrue();
    }

    [Fact]
    public async Task TryApplyAsync_gcp_enables_gcp_baselines_without_disabling_existing_selections()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        InMemoryPolicyPackRepository packs = new();
        InMemoryPolicyPackAssignmentRepository assignments = new();

        Guid cisAzurePackId = await SeedPlatformPackAsync(
            packs,
            assignments,
            tenantId,
            workspaceId,
            projectId,
            DefaultPolicyPackCatalog.CisAzureFoundationsDisplayName,
            isEnabled: true);

        Guid cisGcpPackId = await SeedPlatformPackAsync(
            packs,
            assignments,
            tenantId,
            workspaceId,
            projectId,
            DefaultPolicyPackCatalog.CisGcpFoundationsDisplayName,
            isEnabled: false);

        DefaultPolicyPackCloudBaselineApplicator sut = new(
            packs,
            assignments,
            NullLogger<DefaultPolicyPackCloudBaselineApplicator>.Instance);

        await sut.TryApplyAsync(tenantId, workspaceId, projectId, CloudProvider.Gcp, CancellationToken.None);

        IReadOnlyList<PolicyPackAssignment> updated =
            await assignments.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        FindAssignment(updated, cisAzurePackId).IsEnabled.Should().BeTrue();
        FindAssignment(updated, cisGcpPackId).IsEnabled.Should().BeTrue();
    }

    private static async Task<Guid> SeedPlatformPackAsync(
        InMemoryPolicyPackRepository packs,
        InMemoryPolicyPackAssignmentRepository assignments,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string displayName,
        bool isEnabled)
    {
        PolicyPack pack = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = displayName,
            Description = displayName,
            PackType = PolicyPackType.PlatformDefault,
            Status = PolicyPackStatus.Active,
        };

        await packs.CreateAsync(pack, CancellationToken.None);

        PolicyPackAssignment assignment = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = pack.PolicyPackId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = isEnabled,
        };

        await assignments.CreateAsync(assignment, CancellationToken.None);

        return pack.PolicyPackId;
    }

    private static PolicyPackAssignment FindAssignment(
        IReadOnlyList<PolicyPackAssignment> assignments,
        Guid policyPackId)
    {
        foreach (PolicyPackAssignment assignment in assignments)
        {
            if (assignment.PolicyPackId == policyPackId)
                return assignment;
        }

        throw new InvalidOperationException($"Assignment for pack {policyPackId} was not found.");
    }
}
