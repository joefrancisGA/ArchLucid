using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RecordBulkFindingDispositionDeserializationTests
{
    [Fact]
    public void Deserialize_null_finding_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingIds": null,
              "disposition": 0,
              "rationale": "bulk update"
            }
            """;

        RecordBulkFindingDispositionRequest? request =
            JsonSerializer.Deserialize<RecordBulkFindingDispositionRequest>(json, ContractJson.CamelCaseCompact);

        request.Should().NotBeNull();
        request!.FindingIds.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_updated_finding_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "processedCount": 0,
              "updatedFindingIds": null
            }
            """;

        RecordBulkFindingDispositionResponse? response =
            JsonSerializer.Deserialize<RecordBulkFindingDispositionResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.UpdatedFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
