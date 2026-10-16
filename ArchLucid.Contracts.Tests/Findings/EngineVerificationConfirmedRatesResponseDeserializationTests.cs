using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class EngineVerificationConfirmedRatesResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_rows_yields_empty_list_not_null()
    {
        const string json = """
            {
              "fromUtc": "2026-10-15T00:00:00Z",
              "toUtcExclusive": "2026-10-16T00:00:00Z",
              "rows": null
            }
            """;

        EngineVerificationConfirmedRatesResponse? response =
            JsonSerializer.Deserialize<EngineVerificationConfirmedRatesResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Rows.Should().NotBeNull().And.BeEmpty();
    }
}
