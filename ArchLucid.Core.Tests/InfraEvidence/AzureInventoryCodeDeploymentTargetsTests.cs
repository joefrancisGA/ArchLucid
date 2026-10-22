using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryCodeDeploymentTargetsTests
{
    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", "vm-run-command")]
    [InlineData("Microsoft.Logic/workflows", "logic-app-workflow")]
    [InlineData("Microsoft.Web/sites", "site-code-deploy")]
    public void TryGetCodeDeploymentInferenceQualifier_returns_expected_qualifier(string resourceType, string expectedQualifier)
    {
        bool resolved = AzureInventoryCodeDeploymentTargets.TryGetCodeDeploymentInferenceQualifier(
            resourceType,
            out string qualifier);

        Assert.True(resolved);
        Assert.Equal(expectedQualifier, qualifier);
    }

    [Fact]
    public void IsCodeDeploymentResourceType_rejects_unrelated_type()
    {
        Assert.False(AzureInventoryCodeDeploymentTargets.IsCodeDeploymentResourceType("Microsoft.Storage/storageAccounts"));
    }
}
