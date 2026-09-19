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
    [InlineData("SQL DB Contributor", AzureInventoryDerivedDataPlanePermission.ReadAndWrite)]
    [InlineData("Azure Service Bus Data Receiver", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Azure Service Bus Data Sender", AzureInventoryDerivedDataPlanePermission.Write)]
    [InlineData("Azure Service Bus Data Owner", AzureInventoryDerivedDataPlanePermission.ReadAndWrite)]
    [InlineData("Azure Event Hubs Data Receiver", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Azure Event Hubs Data Sender", AzureInventoryDerivedDataPlanePermission.Write)]
    public void Resolve_allowlisted_roles_map_to_derived_permissions(
        string roleName,
        AzureInventoryDerivedDataPlanePermission expected)
    {
        AzureInventoryRbacDataPlaneRoleMap.Resolve(roleName).Should().Be(expected);
    }

    [Theory]
    [InlineData("Storage Queue Data Message Sender", AzureInventoryDerivedDataPlanePermission.Write)]
    [InlineData("Storage Queue Data Message Processor", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Storage Queue Data Contributor", AzureInventoryDerivedDataPlanePermission.ReadAndWrite)]
    [InlineData("Cognitive Services OpenAI User", AzureInventoryDerivedDataPlanePermission.Write)]
    [InlineData("Search Index Data Contributor", AzureInventoryDerivedDataPlanePermission.ReadAndWrite)]
    [InlineData("Search Index Data Reader", AzureInventoryDerivedDataPlanePermission.Read)]
    [InlineData("Search Service Contributor", AzureInventoryDerivedDataPlanePermission.ReadAndWrite)]
    public void Resolve_sn_rt_05_runtime_roles_map_to_derived_permissions(
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
        AzureInventoryRbacDataPlaneRoleMap.Resolve("Contributor").Should().Be(
            AzureInventoryDerivedDataPlanePermission.Write);
        AzureInventoryRbacDataPlaneRoleMap.Resolve("AcrPull").Should().Be(
            AzureInventoryDerivedDataPlanePermission.None);
    }
}
