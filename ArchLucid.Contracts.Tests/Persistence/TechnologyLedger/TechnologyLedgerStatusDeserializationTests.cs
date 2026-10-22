using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.TechnologyLedger;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerStatusDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_status_throws()
    {
        const string json = """
            {
              "entryId": "entry-1",
              "runId": "run-1",
              "role": 0,
              "technologyName": "Azure SQL",
              "providerFamily": 1,
              "status": 99,
              "source": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<TechnologyLedgerEntry>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_status_throws()
    {
        const string json = """
            {
              "entryId": "entry-1",
              "runId": "run-1",
              "role": 0,
              "technologyName": "Azure SQL",
              "providerFamily": 1,
              "status": "99",
              "source": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<TechnologyLedgerEntry>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_integer_out_of_range_role_throws()
    {
        const string json = """
            {
              "entryId": "entry-1",
              "runId": "run-1",
              "role": 99,
              "technologyName": "Azure SQL",
              "providerFamily": 1,
              "status": 0,
              "source": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<TechnologyLedgerEntry>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_integer_out_of_range_source_throws()
    {
        const string json = """
            {
              "entryId": "entry-1",
              "runId": "run-1",
              "role": 0,
              "technologyName": "Azure SQL",
              "providerFamily": 1,
              "status": 0,
              "source": 99
            }
            """;

        Action act = () => JsonSerializer.Deserialize<TechnologyLedgerEntry>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_status()
    {
        const string json = """
            {
              "entryId": "entry-1",
              "runId": "run-1",
              "role": 0,
              "technologyName": "Azure SQL",
              "providerFamily": 1,
              "status": 1,
              "source": 0
            }
            """;

        TechnologyLedgerEntry entry = JsonSerializer.Deserialize<TechnologyLedgerEntry>(json, ContractJson.Default)!;

        entry.Status.Should().Be(TechnologyLedgerStatus.Assumed);
    }
}
