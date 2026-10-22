using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Decisions;

[Trait("Category", "Unit")]
public sealed class DecisionPersistenceDeserializationTests
{
    [Fact]
    public void Deserialize_null_evidence_refs_on_option_yields_empty_list_not_null()
    {
        const string json = """
            {
              "evidenceRefs": null
            }
            """;

        DecisionOptionRecord? result =
            JsonSerializer.Deserialize<DecisionOptionRecord>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_evidence_refs_on_evaluation_yields_empty_list_not_null()
    {
        const string json = """
            {
              "evidenceRefs": null
            }
            """;

        AgentEvaluationRecord? result =
            JsonSerializer.Deserialize<AgentEvaluationRecord>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
    }
}
