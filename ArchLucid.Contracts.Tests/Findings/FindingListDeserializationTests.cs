using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingListDeserializationTests
{
    [Fact]
    public void Deserialize_null_rationale_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": null
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Rationale.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_title_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": null,
              "rationale": "r"
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Title.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_engine_type_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": null,
              "severity": 0,
              "title": "t",
              "rationale": "r"
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.EngineType.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_category_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": null,
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": "r"
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Category.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_finding_type_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingType": null,
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": "r"
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.FindingType.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": "r",
              "relatedNodeIds": null,
              "evidenceRefs": null,
              "recommendedActions": null
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.RelatedNodeIds.Should().NotBeNull().And.BeEmpty();
        finding.EvidenceRefs.Should().NotBeNull().And.BeEmpty();
        finding.RecommendedActions.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_properties_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": "r",
              "properties": null
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Properties.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_trace_yields_non_null_trace_not_null()
    {
        const string json = """
            {
              "findingType": "test",
              "category": "test",
              "engineType": "test",
              "severity": 0,
              "title": "t",
              "rationale": "r",
              "trace": null
            }
            """;

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Trace.Should().NotBeNull();
    }
}
