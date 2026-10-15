using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestDocumentDeserializationTests
{
    [Fact]
    public void Deserialize_null_required_must_question_keys_yields_empty_list_not_null()
    {
        const string json = """
            {
              "requiredMustQuestionKeys": null
            }
            """;

        DraftRequestDocument? result =
            JsonSerializer.Deserialize<DraftRequestDocument>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.RequiredMustQuestionKeys.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_question_answers_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "questionAnswers": null
            }
            """;

        DraftRequestDocument? result =
            JsonSerializer.Deserialize<DraftRequestDocument>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.QuestionAnswers.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_nested_document_objects_yields_non_null_defaults()
    {
        const string json = """
            {
              "actorSet": null,
              "transparencyTrail": null,
              "structuredBrief": null
            }
            """;

        DraftRequestDocument? result =
            JsonSerializer.Deserialize<DraftRequestDocument>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ActorSet.Should().NotBeNull();
        result.TransparencyTrail.Should().NotBeNull();
        result.StructuredBrief.Should().NotBeNull();
    }
}
