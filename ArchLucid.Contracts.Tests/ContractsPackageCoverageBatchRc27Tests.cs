using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Explanation;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC27 package-coverage batch: tenant-id mapping for architecture intelligence, review-run engine
///     provenance JSON helpers, agent type dispatch keys, and a slim explainability evidence DTO round-trip.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc27Tests
{
    [Fact]
    public void ArchitectureIntelligenceTenantIdMapper_parses_guid_string()
    {
        Guid expected = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(expected.ToString("D")).Should().Be(expected);
        ArchitectureIntelligenceTenantIdMapper.ToStorageGuid("  " + expected.ToString("N") + "  ").Should().Be(expected);
    }

    [Fact]
    public void ArchitectureIntelligenceTenantIdMapper_non_guid_string_uses_sha256_fallback()
    {
        const string tenantId = "pilot-tenant-alpha";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(tenantId));
        byte[] guidBytes = new byte[16];
        Array.Copy(hash, guidBytes, 16);
        Guid expected = new(guidBytes);

        ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId).Should().Be(expected);
        ArchitectureIntelligenceTenantIdMapper.ToStorageGuid("  " + tenantId + "  ").Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ArchitectureIntelligenceTenantIdMapper_empty_throws(string? tenantId)
    {
        Action act = () => ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId!);

        act.Should().Throw<ArgumentException>()
            .WithParameterName("tenantId")
            .WithMessage("*TenantId is required*");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ArchitectureIntelligenceTenantIdMapper_ToStorageGuidOrEmpty_blank_returns_empty(string? value)
    {
        ArchitectureIntelligenceTenantIdMapper.ToStorageGuidOrEmpty(value).Should().Be(Guid.Empty);
    }

    [Fact]
    public void ArchitectureIntelligenceTenantIdMapper_ToStorageGuidOrEmpty_parses_when_present()
    {
        Guid expected = Guid.Parse("11111111-2222-3333-4444-555555555555");

        ArchitectureIntelligenceTenantIdMapper.ToStorageGuidOrEmpty(expected.ToString("D")).Should().Be(expected);
    }

    [Fact]
    public void ReviewRunEngineProvenanceJson_Serialize_null_throws()
    {
        Action act = () => ReviewRunEngineProvenanceJson.Serialize(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("provenance");
    }

    [Fact]
    public void ReviewRunEngineProvenanceJson_Serialize_round_trips()
    {
        ReviewRunEngineProvenance provenance = new()
        {
            ProviderKind = "azure-openai",
            DeploymentOrModelId = "gpt-4.1",
            PromptPackVersion = "pp-3",
            PolicyPackVersion = "pol-2",
            EvidenceSnapshotVersion = "snap-9",
            OutputSchemaVersion = "FindingsSnapshot v2",
            RunTimestampUtc = new DateTime(2026, 8, 9, 16, 0, 0, DateTimeKind.Utc),
            TotalInputTokens = 1200,
            TotalOutputTokens = 400,
            EstimatedCostUsd = 0.42m,
            EngineProfileId = "profile-a",
        };

        string json = ReviewRunEngineProvenanceJson.Serialize(provenance);
        ReviewRunEngineProvenance? roundTripped = ReviewRunEngineProvenanceJson.TryDeserialize(json);

        roundTripped.Should().NotBeNull();
        roundTripped!.ProviderKind.Should().Be("azure-openai");
        roundTripped.DeploymentOrModelId.Should().Be("gpt-4.1");
        roundTripped.PromptPackVersion.Should().Be("pp-3");
        roundTripped.PolicyPackVersion.Should().Be("pol-2");
        roundTripped.EvidenceSnapshotVersion.Should().Be("snap-9");
        roundTripped.OutputSchemaVersion.Should().Be("FindingsSnapshot v2");
        roundTripped.RunTimestampUtc.Should().Be(provenance.RunTimestampUtc);
        roundTripped.TotalInputTokens.Should().Be(1200);
        roundTripped.TotalOutputTokens.Should().Be(400);
        roundTripped.EstimatedCostUsd.Should().Be(0.42m);
        roundTripped.EngineProfileId.Should().Be("profile-a");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{not-json")]
    [InlineData("[]")]
    public void ReviewRunEngineProvenanceJson_TryDeserialize_null_whitespace_or_bad_json_returns_null(string? json)
    {
        ReviewRunEngineProvenanceJson.TryDeserialize(json).Should().BeNull();
    }

    [Fact]
    public void ReviewRunEngineProvenanceJson_TryDeserialize_valid_json_deserializes()
    {
        const string json =
            """{"providerKind":"deterministic","deploymentOrModelId":"local","runTimestampUtc":"2026-08-09T12:00:00Z"}""";

        ReviewRunEngineProvenance? provenance = ReviewRunEngineProvenanceJson.TryDeserialize(json);

        provenance.Should().NotBeNull();
        provenance!.ProviderKind.Should().Be("deterministic");
        provenance.DeploymentOrModelId.Should().Be("local");
        provenance.RunTimestampUtc.Should().Be(new DateTime(2026, 8, 9, 12, 0, 0, DateTimeKind.Utc));
    }

    [Theory]
    [InlineData(AgentType.Topology, AgentTypeKeys.Topology)]
    [InlineData(AgentType.Cost, AgentTypeKeys.Cost)]
    [InlineData(AgentType.Compliance, AgentTypeKeys.Compliance)]
    [InlineData(AgentType.Critic, AgentTypeKeys.Critic)]
    public void AgentTypeKeys_FromEnum_maps_all_values(AgentType agentType, string expectedKey)
    {
        AgentTypeKeys.FromEnum(agentType).Should().Be(expectedKey);
    }

    [Fact]
    public void AgentTypeKeys_FromEnum_unknown_throws()
    {
        const AgentType unknown = (AgentType)42;

        Action act = () => AgentTypeKeys.FromEnum(unknown);

        act.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("agentType");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AgentTypeKeys_TryMapToEnum_blank_returns_null(string? key)
    {
        AgentTypeKeys.TryMapToEnum(key!).Should().BeNull();
    }

    [Theory]
    [InlineData("topology", AgentType.Topology)]
    [InlineData("TOPOLOGY", AgentType.Topology)]
    [InlineData("cost", AgentType.Cost)]
    [InlineData("Cost", AgentType.Cost)]
    [InlineData("compliance", AgentType.Compliance)]
    [InlineData("COMPLIANCE", AgentType.Compliance)]
    [InlineData("critic", AgentType.Critic)]
    [InlineData(" Critic ", AgentType.Critic)]
    public void AgentTypeKeys_TryMapToEnum_builtin_keys_case_insensitive(string key, AgentType expected)
    {
        AgentTypeKeys.TryMapToEnum(key).Should().Be(expected);
    }

    [Fact]
    public void AgentTypeKeys_TryMapToEnum_unknown_returns_null()
    {
        AgentTypeKeys.TryMapToEnum("custom-risk").Should().BeNull();
    }

    [Fact]
    public void AgentTypeKeys_ResolveDispatchKey_uses_explicit_key_when_set()
    {
        AgentTask task = new()
        {
            RunId = "run-1",
            AgentType = AgentType.Topology,
            AgentTypeKey = "  custom-handler  ",
            Objective = "map topology",
        };

        AgentTypeKeys.ResolveDispatchKey(task).Should().Be("custom-handler");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AgentTypeKeys_ResolveDispatchKey_falls_back_to_enum(string? agentTypeKey)
    {
        AgentTask task = new()
        {
            RunId = "run-2",
            AgentType = AgentType.Cost,
            AgentTypeKey = agentTypeKey,
            Objective = "estimate cost",
        };

        AgentTypeKeys.ResolveDispatchKey(task).Should().Be(AgentTypeKeys.Cost);
    }

    [Fact]
    public void AgentTypeKeys_CompareDispatchKeys_orders_lexicographically_case_insensitive()
    {
        AgentTypeKeys.CompareDispatchKeys("beta", "Alpha").Should().BeGreaterThan(0);
        AgentTypeKeys.CompareDispatchKeys("same", "SAME").Should().Be(0);
        AgentTypeKeys.CompareDispatchKeys("a", "b").Should().BeLessThan(0);
    }

    [Fact]
    public void FindingExplainabilityEvidenceRecord_round_trips_properties()
    {
        FindingExplainabilityEvidenceRecord record = new(
            EvidenceRefs: ["ref-a", "ref-b"],
            Conclusion: "Endpoint remains public.",
            AlternativePathsConsidered: ["private-endpoint", "service-firewall"],
            RuleId: "rule-public-endpoint");

        record.EvidenceRefs.Should().Equal("ref-a", "ref-b");
        record.Conclusion.Should().Be("Endpoint remains public.");
        record.AlternativePathsConsidered.Should().Equal("private-endpoint", "service-firewall");
        record.RuleId.Should().Be("rule-public-endpoint");
    }
}
