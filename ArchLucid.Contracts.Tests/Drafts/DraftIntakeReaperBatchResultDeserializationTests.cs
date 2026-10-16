using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftIntakeReaperBatchResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_deleted_draft_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "deletedDraftIds": null
            }
            """;

        DraftIntakeReaperBatchResult result =
            JsonSerializer.Deserialize<DraftIntakeReaperBatchResult>(json, ContractJson.CamelCaseCompact)!;

        result.DeletedDraftIds.Should().NotBeNull().And.BeEmpty();
    }
}
