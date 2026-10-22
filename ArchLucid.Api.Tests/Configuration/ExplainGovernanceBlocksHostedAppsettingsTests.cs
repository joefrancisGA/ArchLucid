using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

/// <summary>TB-184 — hosted Staging enables governance-block LLM explanations on pre-commit 409 responses.</summary>
[Trait("Category", "Unit")]
public sealed class ExplainGovernanceBlocksHostedAppsettingsTests
{
    private static string StagingJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Staging.json");

    [SkippableFact]
    public void Staging_appsettings_enables_explain_governance_blocks()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath} (copy from ArchLucid.Api via csproj).");

        ReadOptions(StagingJsonPath).Enabled.Should().BeTrue();
    }

    private static ExplainGovernanceBlocksOptions ReadOptions(string path)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(path, optional: false, reloadOnChange: false)
            .Build();

        ExplainGovernanceBlocksOptions? options = configuration
            .GetSection(ExplainGovernanceBlocksOptions.SectionPath)
            .Get<ExplainGovernanceBlocksOptions>();

        options.Should().NotBeNull();

        return options!;
    }
}
