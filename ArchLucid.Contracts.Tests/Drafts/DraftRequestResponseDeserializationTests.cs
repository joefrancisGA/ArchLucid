using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_document_yields_non_null_document_not_null()
    {
        const string json = """
            {
              "draftId": "00000000-0000-0000-0000-000000000001",
              "document": null
            }
            """;

        DraftRequestResponse? response =
            JsonSerializer.Deserialize<DraftRequestResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Document.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_work_lease_remains_null()
    {
        const string json = """
            {
              "draftId": "00000000-0000-0000-0000-000000000001",
              "workLease": null
            }
            """;

        DraftRequestResponse? response =
            JsonSerializer.Deserialize<DraftRequestResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.WorkLease.Should().BeNull();
    }
}
