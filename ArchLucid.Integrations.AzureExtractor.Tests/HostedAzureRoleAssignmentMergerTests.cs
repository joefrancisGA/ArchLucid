using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureRoleAssignmentMergerTests
{
    [Fact]
    public void Merge_standing_assignment_overrides_eligible_duplicate()
    {
        const string scope = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string principalId = "11111111-1111-1111-1111-111111111111";
        const string roleDefinitionId =
            "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> eligible =
        [
            new HostedAzureArmRoleAssignmentRecord(
                scope,
                principalId,
                "User",
                roleDefinitionId,
                PimEligibilityKind: "eligible"),
        ];

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> standing =
        [
            new HostedAzureArmRoleAssignmentRecord(
                scope,
                principalId,
                "User",
                roleDefinitionId,
                PimEligibilityKind: "standing"),
        ];

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> merged =
            HostedAzureRoleAssignmentMerger.Merge(standing, eligible);

        HostedAzureArmRoleAssignmentRecord row = Assert.Single(merged);
        Assert.Equal("standing", row.PimEligibilityKind);
    }

    [Fact]
    public void Merge_retains_eligible_only_rows()
    {
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> eligible =
        [
            new HostedAzureArmRoleAssignmentRecord(
                "/subscriptions/sub",
                "22222222-2222-2222-2222-222222222222",
                "Group",
                "/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f60684581c14",
                PimEligibilityKind: "eligible"),
        ];

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> merged =
            HostedAzureRoleAssignmentMerger.Merge([], eligible);

        Assert.Single(merged);
        Assert.Equal("eligible", merged[0].PimEligibilityKind);
    }
}
