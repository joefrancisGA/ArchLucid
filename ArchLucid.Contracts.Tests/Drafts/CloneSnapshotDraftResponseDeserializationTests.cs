using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class CloneSnapshotDraftResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_clone_yields_non_null_clone_not_null()
    {
        const string json = """
            {
              "sourceDraftId": "00000000-0000-0000-0000-000000000001",
              "clone": null
            }
            """;

        CloneSnapshotDraftResponse? response =
            JsonSerializer.Deserialize<CloneSnapshotDraftResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Clone.Should().NotBeNull();
    }
}
