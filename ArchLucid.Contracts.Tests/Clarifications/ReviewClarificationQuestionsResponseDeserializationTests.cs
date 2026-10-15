using System.Text.Json;

using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Clarifications;

[Trait("Category", "Unit")]
public sealed class ReviewClarificationQuestionsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_questions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "questions": null
            }
            """;

        ReviewClarificationQuestionsResponse response =
            JsonSerializer.Deserialize<ReviewClarificationQuestionsResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Questions.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_delta_question_id_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "questions": [],
              "deltaFromPriorRun": {
                "priorRunId": "prior-run",
                "resolvedByEvidenceQuestionIds": null,
                "resolvedByAssertionQuestionIds": null,
                "stillOpenQuestionIds": null
              }
            }
            """;

        ReviewClarificationQuestionsResponse response =
            JsonSerializer.Deserialize<ReviewClarificationQuestionsResponse>(json, ContractJson.CamelCaseCompact)!;

        response.DeltaFromPriorRun.Should().NotBeNull();
        response.DeltaFromPriorRun!.ResolvedByEvidenceQuestionIds.Should().NotBeNull().And.BeEmpty();
        response.DeltaFromPriorRun.ResolvedByAssertionQuestionIds.Should().NotBeNull().And.BeEmpty();
        response.DeltaFromPriorRun.StillOpenQuestionIds.Should().NotBeNull().And.BeEmpty();
    }
}
