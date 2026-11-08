using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingVerificationReportResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_results_yields_empty_list_not_null()
    {
        const string json = """
            {
              "reportId": "11111111-1111-1111-1111-111111111111",
              "runId": "22222222-2222-2222-2222-222222222222",
              "sourceManifestHash": "manifest-hash",
              "reportHash": "report-hash",
              "createdUtc": "2026-01-01T00:00:00Z",
              "results": null
            }
            """;

        FindingVerificationReportResponse? report =
            JsonSerializer.Deserialize<FindingVerificationReportResponse>(json, ContractJson.CamelCaseCompact);

        report.Should().NotBeNull();
        report!.Results.Should().NotBeNull().And.BeEmpty();
    }
}
