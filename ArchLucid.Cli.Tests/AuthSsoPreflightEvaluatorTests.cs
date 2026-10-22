using ArchLucid.Cli.Commands;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthSsoPreflightEvaluatorTests
{
    [Fact]
    public async Task Evaluate_reports_api_key_and_redacts_key_vault_references()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["ArchLucid:Secrets:Example"] = "@Microsoft.KeyVault(SecretUri=https://example.vault.azure.net/secrets/x)",
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        IReadOnlyList<AuthSsoPreflightCheckResult> results = await AuthSsoPreflightEvaluator.EvaluateAsync(
            configuration,
            Directory.GetCurrentDirectory(),
            new HttpClient(new OfflineHttpHandler()),
            CancellationToken.None);

        results.Should().Contain(r => r.Component == "auth.mode" && r.Detail.Contains("ApiKey"));
        results.Should().Contain(r => r.Component == "secrets.keyVaultReferences" && r.Status == AuthSsoPreflightCheckStatus.Pass);
        string serialized = string.Join('\n', results.Select(r => r.Detail));

        serialized.Should().NotContain("SecretUri=https://");
    }

    [Fact]
    public async Task Evaluate_jwt_mode_without_authority_fails_metadata_check()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucidAuth:Mode"] = "JwtBearer",
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        IReadOnlyList<AuthSsoPreflightCheckResult> results = await AuthSsoPreflightEvaluator.EvaluateAsync(
            configuration,
            Directory.GetCurrentDirectory(),
            new HttpClient(new OfflineHttpHandler()),
            CancellationToken.None);

        results.Should().Contain(r => r.Component == "oidc.metadataReachability" && r.Status == AuthSsoPreflightCheckStatus.Fail);
    }

    private sealed class OfflineHttpHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.ServiceUnavailable));
    }
}
