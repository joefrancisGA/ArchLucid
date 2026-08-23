using ArchLucid.Core.AiProviders;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AiProviders;

[Trait("Category", "Unit")]
public sealed class TenantAzureOpenAiDeploymentsCatalogTests
{
    [Fact]
    public void ResolveDeploymentName_uses_tier_mapping_when_present()
    {
        string json = """{"default":"gpt-4o-mini","Economy":"gpt-4o-mini","Balanced":"gpt-4o"}""";

        string resolved = TenantAzureOpenAiDeploymentsCatalog.ResolveDeploymentName(json, "Balanced");

        resolved.Should().Be("gpt-4o");
    }

    [Fact]
    public void ResolveDeploymentName_matches_default_key_case_insensitively()
    {
        string json = """{"Default":"mapped-deploy","Balanced":"tier-deploy"}""";

        TenantAzureOpenAiDeploymentsCatalog.ResolveDeploymentName(json, "Other")
            .Should().Be("mapped-deploy");
    }

    [Fact]
    public void ResolveDeploymentName_matches_tier_key_case_insensitively()
    {
        string json = """{"default":"fallback-deploy","balanced":"tier-deploy"}""";

        TenantAzureOpenAiDeploymentsCatalog.ResolveDeploymentName(json, "Balanced")
            .Should().Be("tier-deploy");
    }

    [Fact]
    public void TryParse_returns_case_insensitive_tier_keys()
    {
        bool parsed = TenantAzureOpenAiDeploymentsCatalog.TryParse(
            """{"Default":"mapped-deploy"}""",
            out IReadOnlyDictionary<string, string> deployments,
            out string? error);

        parsed.Should().BeTrue();
        error.Should().BeNull();
        deployments.TryGetValue("default", out string? deployment).Should().BeTrue();
        deployment.Should().Be("mapped-deploy");
    }
}
