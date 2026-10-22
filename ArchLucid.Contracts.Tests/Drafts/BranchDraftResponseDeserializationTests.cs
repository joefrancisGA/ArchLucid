using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class BranchDraftResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_branch_yields_non_null_branch_not_null()
    {
        const string json = """
            {
              "parentDraftId": "00000000-0000-0000-0000-000000000001",
              "branch": null
            }
            """;

        BranchDraftResponse? response =
            JsonSerializer.Deserialize<BranchDraftResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Branch.Should().NotBeNull();
    }
}
