using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultClaimListJsonConverterEvidenceRefsTests
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new AgentTypeJsonConverter(),
            new AgentResultClaimListJsonConverter(),
        },
    };

    [Fact]
    public void Deserialize_merges_structured_claim_evidence_refs_into_result_evidence_refs()
    {
        const string json = """
                              {
                                "resultId": "r1",
                                "taskId": "t1",
                                "runId": "run1",
                                "agentType": "Topology",
                                "claims": [
                                  { "detail": "Subnet missing", "evidenceRefs": ["pol-123"] }
                                ],
                                "evidenceRefs": [],
                                "confidence": 0.5,
                                "createdUtc": "2026-01-01T00:00:00Z"
                              }
                              """;

        AgentResult? result = JsonSerializer.Deserialize<AgentResult>(json, Options);

        result.Should().NotBeNull();
        result!.Claims.Should().ContainSingle(c => c.Contains("Subnet missing", StringComparison.Ordinal));
        result.EvidenceRefs.Should().Contain("pol-123");
    }
}
