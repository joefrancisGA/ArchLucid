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
}
