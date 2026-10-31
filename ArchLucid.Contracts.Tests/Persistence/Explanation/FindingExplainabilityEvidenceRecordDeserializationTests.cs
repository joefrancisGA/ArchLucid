using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Explanation;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Explanation;

[Trait("Category", "Unit")]
public sealed class FindingExplainabilityEvidenceRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_evidence_refs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "evidenceRefs": null,
              "conclusion": "ok",
              "alternativePathsConsidered": null,
              "ruleId": "rule-1"
            }
            """;

        FindingExplainabilityEvidenceRecord? record =
            JsonSerializer.Deserialize<FindingExplainabilityEvidenceRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
        record.AlternativePathsConsidered.Should().NotBeNull().And.BeEmpty();
    }
}
