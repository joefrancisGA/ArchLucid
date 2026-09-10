using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class AzureInventoryRbacDataPlaneRoleMapTests
{
    [Theory]
    [InlineData("Reader", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Storage Blob Data Reader", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Key Vault Secrets User", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Contributor", AzureInventoryDerivedDataPlanePermission.Write)]
    [InlineData("Owner", AzureInventoryDerivedDataPlanePermission.Write)]
    [InlineData("Storage Blob Data Contributor", AzureInventoryDerivedDataPlanePermission.Write)]
    public void Resolve_allowlisted_roles_map_to_derived_permissions(
        string roleName,
        AzureInventoryDerivedDataPlanePermission expected)
    {
        AzureInventoryRbacDataPlaneRoleMap.Resolve(roleName).Should().Be(expected);
    }

    [Fact]
    public void Resolve_unknown_role_returns_none()
    {
        AzureInventoryRbacDataPlaneRoleMap.Resolve("Security Admin").Should().Be(
            AzureInventoryDerivedDataPlanePermission.None);
    }
}
