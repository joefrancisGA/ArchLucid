using ArchLucid.Contracts.Governance;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

/// <summary>LP-18 / DR-04 — hosted Staging/Production must keep the pre-finalize governance gate enabled.</summary>
[Trait("Category", "Unit")]
public sealed class PreCommitGateHostedAppsettingsTests
{
    private static string StagingJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Staging.json");

    private static string ProductionJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Production.json");

    [SkippableFact]
    public void Staging_appsettings_enables_pre_commit_gate()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(StagingJsonPath, optional: false, reloadOnChange: false)
            .Build();

        PreCommitGovernanceGateOptions? options = configuration
            .GetSection(PreCommitGovernanceGateOptions.SectionPath)
            .Get<PreCommitGovernanceGateOptions>();

        options.Should().NotBeNull();
        options!.PreCommitGateEnabled.Should().BeTrue();
    }

    [SkippableFact]
    public void Production_appsettings_enables_pre_commit_gate()
    {
        Skip.IfNot(File.Exists(ProductionJsonPath), $"Expected {ProductionJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(ProductionJsonPath, optional: false, reloadOnChange: false)
            .Build();

        PreCommitGovernanceGateOptions? options = configuration
            .GetSection(PreCommitGovernanceGateOptions.SectionPath)
            .Get<PreCommitGovernanceGateOptions>();

        options.Should().NotBeNull();
        options!.PreCommitGateEnabled.Should().BeTrue();
    }
}
