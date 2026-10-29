using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class RephraseClarificationAnswersResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_rephrased_answers_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "rephrasedAnswers": null
            }
            """;

        RephraseClarificationAnswersResponse? response =
            JsonSerializer.Deserialize<RephraseClarificationAnswersResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.RephrasedAnswers.Should().NotBeNull().And.BeEmpty();
    }
}
