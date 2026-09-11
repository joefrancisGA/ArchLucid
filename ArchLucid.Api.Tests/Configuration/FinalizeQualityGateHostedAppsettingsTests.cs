using ArchLucid.Contracts.Governance;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

/// <summary>TB-2321 — hosted Staging/Production must keep the server-side finalize quality scorecard gate enabled.</summary>
[Trait("Category", "Unit")]
public sealed class FinalizeQualityGateHostedAppsettingsTests
{
    private static string StagingJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Staging.json");

    private static string ProductionJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Production.json");

    [SkippableFact]
    public void Staging_appsettings_enables_finalize_quality_gate()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath} (copy from ArchLucid.Api via csproj).");

        ReadOptions(StagingJsonPath).Enabled.Should().BeTrue();
    }

    [SkippableFact]
    public void Production_appsettings_enables_finalize_quality_gate()
    {
        Skip.IfNot(File.Exists(ProductionJsonPath), $"Expected {ProductionJsonPath} (copy from ArchLucid.Api via csproj).");

        ReadOptions(ProductionJsonPath).Enabled.Should().BeTrue();
    }

    private static FinalizeQualityGateOptions ReadOptions(string path)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(path, optional: false, reloadOnChange: false)
            .Build();

        FinalizeQualityGateOptions? options = configuration
            .GetSection(FinalizeQualityGateOptions.SectionPath)
            .Get<FinalizeQualityGateOptions>();

        options.Should().NotBeNull();

        return options!;
    }
}
