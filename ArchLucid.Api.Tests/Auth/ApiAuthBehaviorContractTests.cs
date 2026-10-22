using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Authentication;

using FluentAssertions;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Auth;

/// <summary>
///     Locks documented API auth behavior to shipped defaults and handler semantics
///     (<see cref="docs/library/API_AUTH_BEHAVIOR_CONTRACT.md" />).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApiAuthBehaviorContractTests
{
    private static readonly string RepoRoot = LocateRepoRoot();

    [Fact]
    public void Shipped_appsettings_json_uses_ApiKey_mode_with_keys_disabled_fail_closed()
    {
        IConfiguration configuration = LoadJsonConfig("ArchLucid.Api/appsettings.json");

        configuration["ArchLucidAuth:Mode"].Should().Be("ApiKey");
        configuration["Authentication:ApiKey:Enabled"].Should().BeEquivalentTo("false");
        configuration["Authentication:ApiKey:DevelopmentBypassAll"].Should().BeNull();
    }

    [Fact]
    public void Development_appsettings_uses_DevelopmentBypass_mode()
    {
        IConfiguration configuration = LoadJsonConfig("ArchLucid.Api/appsettings.Development.json");

        configuration["ArchLucidAuth:Mode"].Should().Be("DevelopmentBypass");
        configuration["Authentication:ApiKey:DevelopmentBypassAll"].Should().BeEquivalentTo("false");
    }

    [Fact]
    public void AddArchLucidAuth_selects_expected_default_scheme_per_mode()
    {
        AssertSchemeForMode("ApiKey", AuthServiceCollectionExtensions.ApiKeySchemeName);
        AssertSchemeForMode("DevelopmentBypass", DevelopmentBypassAuthenticationHandler.SchemeName);
        AssertSchemeForMode("JwtBearer", "Bearer");
    }

    [Fact]
    public void Contract_markdown_documents_all_modes_and_fail_closed_ApiKey()
    {
        string contractPath = Path.Combine(RepoRoot, "docs/library/API_AUTH_BEHAVIOR_CONTRACT.md");
        File.Exists(contractPath).Should().BeTrue("contract doc must exist");

        string text = File.ReadAllText(contractPath);

        text.Should().Contain("ApiKey");
        text.Should().Contain("DevelopmentBypass");
        text.Should().Contain("JwtBearer");
        text.Should().Contain("fail closed", because: "ApiKey disabled posture must be documented");
        text.Should().Contain("X-Api-Key");
        text.Should().Contain("Authentication:ApiKey:Enabled");
        text.Should().Contain("ScopeIdentityBindingMiddleware");
        text.Should().Contain("Authentication:ApiKey:TenantId");
    }

    private static void AssertSchemeForMode(string mode, string expectedScheme)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucidAuth:Mode"] = mode,
                    ["ArchLucidAuth:Authority"] = mode.Equals("JwtBearer", StringComparison.OrdinalIgnoreCase)
                        ? "https://login.example.com/"
                        : null,
                    ["ArchLucidAuth:Audience"] = mode.Equals("JwtBearer", StringComparison.OrdinalIgnoreCase)
                        ? "api://archlucid"
                        : null,
                })
            .Build();

        ServiceCollection services = new();
        services.AddLogging();
        services.AddArchLucidAuth(configuration);

        using ServiceProvider serviceProvider = services.BuildServiceProvider();
        AuthenticationOptions authOptions =
            serviceProvider.GetRequiredService<IOptions<AuthenticationOptions>>().Value;

        authOptions.DefaultAuthenticateScheme.Should().Be(expectedScheme, because: $"mode {mode} should register {expectedScheme}");
    }

    private static IConfiguration LoadJsonConfig(string relativePath)
    {
        string absolute = Path.Combine(RepoRoot, relativePath.Replace('/', Path.DirectorySeparatorChar));
        File.Exists(absolute).Should().BeTrue($"config file must exist: {relativePath}");

        return new ConfigurationBuilder().AddJsonFile(absolute, optional: false).Build();
    }

    private static string LocateRepoRoot()
    {
        DirectoryInfo? current = new DirectoryInfo(AppContext.BaseDirectory);

        for (int depth = 0; depth < 12 && current is not null; depth++)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
                return current.FullName;

            if (Directory.Exists(Path.Combine(current.FullName, "ArchLucid.Api"))
                && Directory.Exists(Path.Combine(current.FullName, "docs")))
                return current.FullName;

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate ArchLucid repository root from test base directory.");
    }
}
