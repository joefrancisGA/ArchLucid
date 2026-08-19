using ArchLucid.Application.Agents.Evidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentCuratedEvidenceProposerTests
{
    [Fact]
    public void NormalizeResponse_returns_null_for_literal_null()
    {
        AgentCuratedEvidenceProposer.NormalizeResponse("null").Should().BeNull();
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
