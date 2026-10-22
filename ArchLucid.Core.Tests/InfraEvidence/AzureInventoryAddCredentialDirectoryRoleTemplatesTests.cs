using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAddCredentialDirectoryRoleTemplatesTests
{
    [Theory]
    [InlineData(AzureInventoryAddCredentialDirectoryRoleTemplates.ApplicationAdministrator)]
    [InlineData(AzureInventoryAddCredentialDirectoryRoleTemplates.CloudApplicationAdministrator)]
    [InlineData(AzureInventoryAddCredentialDirectoryRoleTemplates.GlobalAdministrator)]
    public void IsTenantWideCanAddCredentialRole_accepts_book_roles(string templateId)
    {
        Assert.True(AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideCanAddCredentialRole(templateId));
    }

    [Fact]
    public void IsTenantWideCanAddCredentialRole_rejects_privileged_role_administrator()
    {
        Assert.False(
            AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideCanAddCredentialRole(
                "e8611ab8-c247-4fe8-91da-aa3116096c41"));
    }

    [Fact]
    public void IsTenantWideDirectoryScope_requires_root_scope()
    {
        Assert.True(AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideDirectoryScope("/"));
        Assert.False(AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideDirectoryScope("/administrativeUnits/au1"));
    }
}
