using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class QuestionSelectionResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "allQuestions": null,
              "requiredMustQuestionKeys": null,
              "pendingMustQuestions": null
            }
            """;

        QuestionSelectionResult result =
            JsonSerializer.Deserialize<QuestionSelectionResult>(json, ContractJson.CamelCaseCompact)!;

        result.AllQuestions.Should().NotBeNull().And.BeEmpty();
        result.RequiredMustQuestionKeys.Should().NotBeNull().And.BeEmpty();
        result.PendingMustQuestions.Should().NotBeNull().And.BeEmpty();
    }
}
