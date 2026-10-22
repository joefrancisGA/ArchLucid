using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ExtractionFidelityCaseDeserializationTests
{
    [Fact]
    public void Deserialize_null_expectation_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "caseId": "case-1",
              "sourceText": "text",
              "expectedElementKinds": null,
              "expectedNames": null
            }
            """;

        ExtractionFidelityCase? fidelityCase =
            JsonSerializer.Deserialize<ExtractionFidelityCase>(json, ContractJson.CamelCaseCompact);

        fidelityCase.Should().NotBeNull();
        fidelityCase!.ExpectedElementKinds.Should().NotBeNull().And.BeEmpty();
        fidelityCase.ExpectedNames.Should().NotBeNull().And.BeEmpty();
    }
}
