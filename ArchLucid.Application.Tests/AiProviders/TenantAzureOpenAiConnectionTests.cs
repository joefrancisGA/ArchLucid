using ArchLucid.Application.AiProviders;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.AiProviders;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AiProviders;

[Trait("Category", "Unit")]
public sealed class TenantAzureOpenAiConnectionUpsertValidationTests
{
    [Fact]
    public void TryBuildCommand_RejectsSecretNamesThatLookLikeUrls()
    {
        TenantAzureOpenAiConnectionUpsertRequest request = new()
        {
            Endpoint = "https://contoso.openai.azure.com",
            ApiKeyKeyVaultSecretName = "https://vault/contoso-key",
            DeploymentsJson = """{"default":"gpt-4o"}""",
        };

        bool ok = TenantAzureOpenAiConnectionUpsertValidation.TryBuildCommand(request, out _, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("Key Vault secret name");
    }

    [Fact]
    public void TryBuildCommand_AcceptsValidPayload()
    {
        TenantAzureOpenAiConnectionUpsertRequest request = new()
        {
            Endpoint = "https://contoso.openai.azure.com/",
            ApiKeyKeyVaultSecretName = "tenant-contoso-azure-openai-api-key",
            DeploymentsJson = """{"default":"gpt-4o"}""",
            Label = "Primary",
        };

        bool ok = TenantAzureOpenAiConnectionUpsertValidation.TryBuildCommand(request, out TenantAzureOpenAiConnectionUpsertCommand? command, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        command!.Endpoint.Should().Be("https://contoso.openai.azure.com");
        command.ApiKeyKeyVaultSecretName.Should().Be("tenant-contoso-azure-openai-api-key");
    }
}

[Trait("Category", "Unit")]
public sealed class TenantAzureOpenAiDeploymentsCatalogTests
{
    [Fact]
    public void ResolveDeploymentName_UsesTierMappingWhenPresent()
    {
        string json = """{"default":"gpt-4o-mini","Economy":"gpt-4o-mini","Balanced":"gpt-4o"}""";

        string resolved = TenantAzureOpenAiDeploymentsCatalog.ResolveDeploymentName(json, "Balanced");

        resolved.Should().Be("gpt-4o");
    }
}
