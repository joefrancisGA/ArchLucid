using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftAdmissionResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "pendingMustQuestions": null,
              "requiredMustQuestionKeys": null
            }
            """;

        DraftAdmissionResponse? result =
            JsonSerializer.Deserialize<DraftAdmissionResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.PendingMustQuestions.Should().NotBeNull().And.BeEmpty();
        result.RequiredMustQuestionKeys.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_draft_and_verdict_yields_non_null_nested_objects()
    {
        const string json = """
            {
              "draft": null,
              "verdict": null
            }
            """;

        DraftAdmissionResponse? result =
            JsonSerializer.Deserialize<DraftAdmissionResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Draft.Should().NotBeNull();
        result.Verdict.Should().NotBeNull();
    }
}
