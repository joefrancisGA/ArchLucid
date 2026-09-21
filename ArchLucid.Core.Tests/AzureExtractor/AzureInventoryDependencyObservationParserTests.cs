using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDependencyObservationParserTests
{
    [Fact]
    public void TryParse_rejects_rows_containing_statement_field()
    {
        string json = """
                      {
                        "sourcePrincipalId": "11111111-1111-1111-1111-111111111111",
                        "targetHost": "sql.database.windows.net",
                        "observationKind": "sqlDependency",
                        "operationClass": "read",
                        "eventCount": 3,
                        "collectionStatus": "Succeeded",
                        "statement": "SELECT * FROM Users"
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool parsed = AzureInventoryDependencyObservationParser.TryParse(
            document.RootElement,
            out AzureInventoryDependencyObservationRow? row,
            out string? errorMessage);

        parsed.Should().BeFalse();
        row.Should().BeNull();
        errorMessage.Should().Contain("statement");
    }

    [Fact]
    public void TryParse_round_trips_redacted_sql_dependency_row()
    {
        string json = """
                      {
                        "sourcePrincipalId": "11111111-1111-1111-1111-111111111111",
                        "targetHost": "prodsql.database.windows.net",
                        "targetCatalog": "ArchLucid",
                        "observationKind": "sqlDependency",
                        "operationClass": "read",
                        "eventCount": 12,
                        "windowStartUtc": "2026-09-12T00:00:00Z",
                        "windowEndUtc": "2026-09-19T00:00:00Z",
                        "workspaceId": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
                        "collectionStatus": "Succeeded"
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool parsed = AzureInventoryDependencyObservationParser.TryParse(
            document.RootElement,
            out AzureInventoryDependencyObservationRow? row,
            out string? _);

        parsed.Should().BeTrue();
        row!.ObservationKind.Should().Be("sqlDependency");
        row.OperationClass.Should().Be("read");
        row.EventCount.Should().Be(12);
        row.TargetCatalog.Should().Be("ArchLucid");
    }
}
