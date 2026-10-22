using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_findings_yields_empty_list_not_null()
    {
        const string json = """
            {
              "scanId": "scan-1",
              "summary": "ok",
              "findings": null,
              "completedUtc": "2026-10-15T00:00:00Z"
            }
            """;

        QuickScanResult result =
            JsonSerializer.Deserialize<QuickScanResult>(json, ContractJson.CamelCaseCompact)!;

        result.Findings.Should().NotBeNull().And.BeEmpty();
    }
}
