using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InferenceQuestionnaireListResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        InferenceQuestionnaireListResponse? response =
            JsonSerializer.Deserialize<InferenceQuestionnaireListResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
