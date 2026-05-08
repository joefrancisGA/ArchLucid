using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

/// <summary>
///     Locks production-like Staging JSON to the pilot-strict blocking posture (effective bind, not duplicate literals).
/// </summary>
public sealed class AgentOutputQualityGateStagingAppsettingsTests
{
    private static string StagingJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Staging.json");

    [SkippableFact]
    public void Staging_appsettings_binds_pilot_strict_blocking_posture()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(StagingJsonPath, optional: false, reloadOnChange: false)
            .Build();

        AgentOutputQualityGateOptions? options = configuration
            .GetSection(AgentOutputQualityGateOptions.SectionPath)
            .Get<AgentOutputQualityGateOptions>();

        options.Should().NotBeNull();
        options!.Enabled.Should().BeTrue();
        options.Mode.Should().Be(AgentOutputQualityGateMode.PilotStrict);
        options.EnforceOnReject.Should().BeTrue();
        options.BlockRunOnReject.Should().BeTrue();
        options.PilotStrictMinEvidenceRefCount.Should().Be(2);
        options.PilotStrictMinStructuralCompleteness.Should().Be(0.9);
        options.PilotStrictMinSemanticScore.Should().Be(0.5);
        options.StructuralRejectBelow.Should().Be(0.7);
        options.SemanticRejectBelow.Should().Be(0.5);
    }

    [SkippableFact]
    public void Configuration_layer_after_json_overrides_EnforceOnReject_like_env_vars()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(StagingJsonPath, optional: false, reloadOnChange: false)
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:AgentOutput:QualityGate:EnforceOnReject"] = "false",
                })
            .Build();

        AgentOutputQualityGateOptions? options = configuration
            .GetSection(AgentOutputQualityGateOptions.SectionPath)
            .Get<AgentOutputQualityGateOptions>();

        options.Should().NotBeNull();
        options!.Mode.Should().Be(AgentOutputQualityGateMode.PilotStrict);
        options.EnforceOnReject.Should().BeFalse();
        options.BlockRunOnReject.Should().BeTrue();
    }
}
