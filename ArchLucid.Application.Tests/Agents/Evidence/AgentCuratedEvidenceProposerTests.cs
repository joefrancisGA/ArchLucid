using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentCuratedEvidenceProposerTests
{
    [Fact]
    public void BuildUserPrompt_tolerates_null_collections_on_result_and_evidence()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req",
            Description = new string('x', 12),
            SystemName = "Payments",
        };

        AgentEvidencePackage evidence = new()
        {
            Policies = null!,
            Patterns = null!,
            ServiceCatalog = null!,
        };

        AgentResult result = new()
        {
            RunId = "run",
            TaskId = "task",
            AgentType = AgentType.Topology,
            Findings = null!,
            Claims = null!,
            EvidenceRefs = null!,
        };

        string prompt = AgentCuratedEvidenceProposer.BuildUserPrompt("run", request, evidence, result);

        prompt.Should().Contain("RunId: run");
        prompt.Should().Contain("System: Payments");
    }

    [Fact]
    public void NormalizeResponse_returns_null_for_literal_null()
    {
        AgentCuratedEvidenceProposer.NormalizeResponse("null").Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_description_is_zero_width_space_only()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"\u200b"}
            """;
        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_title_is_zero_width_space_only()
    {
        const string json =
            """
            {"type":"Policy","title":"\u200b","description":"Require TDE on all SQL databases."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_type_is_null()
    {
        const string json =
            """
            {"type":null,"title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_description_is_missing()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","rationale":"Findings cited missing encryption."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_description_is_invisible_unicode_only()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"\u200b","rationale":"Findings cited missing encryption."}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_returns_null_when_rationale_is_zero_width_space_only()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases.","rationale":"\u200b"}
            """;

        AgentCuratedEvidenceProposer.NormalizeResponse(json).Should().BeNull();
    }

    [Fact]
    public void NormalizeResponse_parses_valid_policy_proposal()
    {
        const string json =
            """
            {"type":"Policy","title":"Encrypt SQL TDE","description":"Require TDE on all SQL databases.","rationale":"Findings cited missing encryption."}
            """;

        string? normalized = AgentCuratedEvidenceProposer.NormalizeResponse(json);

        normalized.Should().NotBeNull();
        normalized.Should().Contain("Encrypt SQL TDE");
    }
}
