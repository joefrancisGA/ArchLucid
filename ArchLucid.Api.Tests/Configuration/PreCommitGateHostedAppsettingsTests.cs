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

        ReadOptions(StagingJsonPath).PreCommitGateEnabled.Should().BeTrue();
    }

    [SkippableFact]
    public void Production_appsettings_enables_pre_commit_gate()
    {
        Skip.IfNot(File.Exists(ProductionJsonPath), $"Expected {ProductionJsonPath} (copy from ArchLucid.Api via csproj).");

        ReadOptions(ProductionJsonPath).PreCommitGateEnabled.Should().BeTrue();
    }

    private static string DevelopmentJsonPath =>
        Path.Combine(FindRepoRoot(), "ArchLucid.Api", "appsettings.Development.json");

    [SkippableFact]
    public void Development_appsettings_enables_pre_commit_gate()
    {
        Skip.IfNot(File.Exists(DevelopmentJsonPath), $"Expected {DevelopmentJsonPath}.");

        ReadOptions(DevelopmentJsonPath).PreCommitGateEnabled.Should().BeTrue();
    }

    private static PreCommitGovernanceGateOptions ReadOptions(string path)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(path, optional: false, reloadOnChange: false)
            .Build();

        PreCommitGovernanceGateOptions? options = configuration
            .GetSection(PreCommitGovernanceGateOptions.SectionPath)
            .Get<PreCommitGovernanceGateOptions>();

        options.Should().NotBeNull();

        return options!;
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
