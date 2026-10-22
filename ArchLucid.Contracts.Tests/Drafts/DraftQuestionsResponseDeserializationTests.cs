using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftQuestionsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_selection_yields_non_null_selection_not_null()
    {
        const string json = """
            {
              "draftId": "00000000-0000-0000-0000-000000000001",
              "selection": null
            }
            """;

        DraftQuestionsResponse? response =
            JsonSerializer.Deserialize<DraftQuestionsResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Selection.Should().NotBeNull();
    }
}
