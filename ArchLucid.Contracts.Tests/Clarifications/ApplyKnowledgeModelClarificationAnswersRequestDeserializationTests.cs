using System.Text.Json;

using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Clarifications;

[Trait("Category", "Unit")]
public sealed class ApplyKnowledgeModelClarificationAnswersRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_answers_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "answers": null
            }
            """;

        ApplyKnowledgeModelClarificationAnswersRequest? result =
            JsonSerializer.Deserialize<ApplyKnowledgeModelClarificationAnswersRequest>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Answers.Should().NotBeNull().And.BeEmpty();
    }
}
