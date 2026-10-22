using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

/// <summary>TB-304 startup guard coverage for production-like scope derivation.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ScopeDerivationProductionSafetyRulesTests
{
    [Fact]
    public void CollectScopeDerivationUnsafeInProductionLike_rejects_allow_test_actor_headers()
    {
        List<string> errors = [];
        Dictionary<string, string?> config = new()
        {
            ["ArchLucidAuth:AllowTestActorHeaders"] = "true",
        };
        HostEnvironment environment = new() { EnvironmentName = Environments.Staging };

        ProductionSafetyRules.CollectScopeDerivationUnsafeInProductionLike(
            new ConfigurationBuilder().AddInMemoryCollection(config).Build(),
            environment,
            errors);

        errors.Should().ContainSingle(e => e.Contains("AllowTestActorHeaders", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectScopeDerivationUnsafeInProductionLike_rejects_development_bypass_mode()
    {
        List<string> errors = [];
        Dictionary<string, string?> config = new()
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
        };
        HostEnvironment environment = new() { EnvironmentName = Environments.Production };

        ProductionSafetyRules.CollectScopeDerivationUnsafeInProductionLike(
            new ConfigurationBuilder().AddInMemoryCollection(config).Build(),
            environment,
            errors);

        errors.Should().ContainSingle(e => e.Contains("DevelopmentBypass", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectScopeDerivationUnsafeInProductionLike_skips_development_host()
    {
        List<string> errors = [];
        Dictionary<string, string?> config = new()
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ArchLucidAuth:AllowTestActorHeaders"] = "true",
        };
        HostEnvironment environment = new() { EnvironmentName = Environments.Development };

        ProductionSafetyRules.CollectScopeDerivationUnsafeInProductionLike(
            new ConfigurationBuilder().AddInMemoryCollection(config).Build(),
            environment,
            errors);

        errors.Should().BeEmpty();
    }

    private sealed class HostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
