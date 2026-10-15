using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Diagnostics;

[Trait("Category", "Unit")]
public sealed class WorkspaceAiAvailabilityResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_checks_yields_empty_list_not_null()
    {
        const string json = """
            {
              "isAvailable": true,
              "aiSource": "simulator",
              "summary": "ok",
              "asOfUtc": "2026-10-15T00:00:00Z",
              "checks": null
            }
            """;

        WorkspaceAiAvailabilityResponse response =
            JsonSerializer.Deserialize<WorkspaceAiAvailabilityResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Checks.Should().NotBeNull().And.BeEmpty();
    }
}
