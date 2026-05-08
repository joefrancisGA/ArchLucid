using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Configuration;

/// <summary>
///     Locks hosted Staging/Production JSON to the pilot-strict blocking posture and per-agent reject floors.
/// </summary>
public sealed class AgentOutputQualityGateStagingAppsettingsTests
{
    private static string StagingJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Staging.json");

    private static string ProductionJsonPath =>
        Path.Combine(AppContext.BaseDirectory, "appsettings.Production.json");

    private static void AssertLockedPerAgentRejectFloors(AgentOutputQualityGateOptions options)
    {
        options.PerAgentTypeFloors.Should().ContainKey("Topology");
        options.PerAgentTypeFloors["Topology"].StructuralRejectBelow.Should().Be(0.85);
        options.PerAgentTypeFloors["Topology"].SemanticRejectBelow.Should().Be(0.65);

        options.PerAgentTypeFloors.Should().ContainKey("Compliance");
        options.PerAgentTypeFloors["Compliance"].StructuralRejectBelow.Should().Be(0.8);
        options.PerAgentTypeFloors["Compliance"].SemanticRejectBelow.Should().Be(0.6);

        options.PerAgentTypeFloors.Should().ContainKey("Cost");
        options.PerAgentTypeFloors["Cost"].StructuralRejectBelow.Should().Be(0.75);
        options.PerAgentTypeFloors["Cost"].SemanticRejectBelow.Should().Be(0.55);

        options.PerAgentTypeFloors.Should().ContainKey("Critic");
        options.PerAgentTypeFloors["Critic"].StructuralRejectBelow.Should().Be(0.65);
        options.PerAgentTypeFloors["Critic"].SemanticRejectBelow.Should().Be(0.5);
    }

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
        options.PilotStrictMinFaithfulnessSupportRatio.Should().Be(0.6);
        options.PilotStrictMinAgentResultFaithfulnessSupportRatio.Should().Be(0.7);
        options.StructuralRejectBelow.Should().Be(0.7);
        options.SemanticRejectBelow.Should().Be(0.5);
        AssertLockedPerAgentRejectFloors(options);
    }

    [SkippableFact]
    public void Production_appsettings_binds_same_locked_per_agent_reject_floors()
    {
        Skip.IfNot(File.Exists(ProductionJsonPath), $"Expected {ProductionJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(ProductionJsonPath, optional: false, reloadOnChange: false)
            .Build();

        AgentOutputQualityGateOptions? options = configuration
            .GetSection(AgentOutputQualityGateOptions.SectionPath)
            .Get<AgentOutputQualityGateOptions>();

        options.Should().NotBeNull();
        AssertLockedPerAgentRejectFloors(options!);
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

    [SkippableFact]
    public void Staging_appsettings_pins_AgentResult_schema_enforcement_on_parse()
    {
        Skip.IfNot(File.Exists(StagingJsonPath), $"Expected {StagingJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(StagingJsonPath, optional: false, reloadOnChange: false)
            .Build();

        AgentResultSchemaValidationOptions? schemaOpts = configuration
            .GetSection(AgentResultSchemaValidationOptions.SectionPath)
            .Get<AgentResultSchemaValidationOptions>();

        schemaOpts.Should().NotBeNull();
        schemaOpts!.EnforceOnParse.Should().BeTrue();
    }

    [SkippableFact]
    public void Production_appsettings_pins_AgentResult_schema_enforcement_on_parse()
    {
        Skip.IfNot(File.Exists(ProductionJsonPath), $"Expected {ProductionJsonPath} (copy from ArchLucid.Api via csproj).");

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile(ProductionJsonPath, optional: false, reloadOnChange: false)
            .Build();

        AgentResultSchemaValidationOptions? schemaOpts = configuration
            .GetSection(AgentResultSchemaValidationOptions.SectionPath)
            .Get<AgentResultSchemaValidationOptions>();

        schemaOpts.Should().NotBeNull();
        schemaOpts!.EnforceOnParse.Should().BeTrue();
    }
}
