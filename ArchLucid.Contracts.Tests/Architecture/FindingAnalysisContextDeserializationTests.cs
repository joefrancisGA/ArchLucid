using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class FindingAnalysisContextDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "enabledPolicyPackIds": null,
              "requiredFindingCategories": null,
              "requiredEngineTypes": null,
              "evidencePins": null
            }
            """;

        FindingAnalysisContext? result =
            JsonSerializer.Deserialize<FindingAnalysisContext>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.EnabledPolicyPackIds.Should().NotBeNull().And.BeEmpty();
        result.RequiredFindingCategories.Should().NotBeNull().And.BeEmpty();
        result.RequiredEngineTypes.Should().NotBeNull().And.BeEmpty();
        result.EvidencePins.Should().NotBeNull().And.BeEmpty();
    }
}
