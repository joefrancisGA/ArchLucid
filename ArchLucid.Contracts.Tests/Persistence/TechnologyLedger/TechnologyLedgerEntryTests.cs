using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.TechnologyLedger;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerEntryTests
{
    [Fact]
    public void Construction_defaults_generate_non_empty_id_and_utc_timestamps()
    {
        TechnologyLedgerEntry entry = new();

        entry.EntryId.Should().NotBeNullOrWhiteSpace();
        entry.CreatedUtc.Should().NotBe(default);
        entry.UpdatedUtc.Should().NotBe(default);
        entry.IsLocked.Should().BeFalse();
    }

    [Fact]
    public void Properties_round_trip_expected_values()
    {
        TechnologyLedgerEntry entry = new()
        {
            RunId = "run-1",
            Role = TechnologyLedgerRole.PrimaryDatastore,
            TechnologyName = "Azure SQL Database",
            ProviderFamily = CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            EvidenceRef = "evidence-1",
            Rationale = "Selected during intake.",
            IsLocked = true,
        };

        entry.RunId.Should().Be("run-1");
        entry.Role.Should().Be(TechnologyLedgerRole.PrimaryDatastore);
        entry.TechnologyName.Should().Be("Azure SQL Database");
        entry.ProviderFamily.Should().Be(CloudProvider.Azure);
        entry.Status.Should().Be(TechnologyLedgerStatus.Chosen);
        entry.Source.Should().Be(TechnologyLedgerSource.User);
        entry.EvidenceRef.Should().Be("evidence-1");
        entry.Rationale.Should().Be("Selected during intake.");
        entry.IsLocked.Should().BeTrue();
    }

    /// <summary>
    ///     Guards against drift between the C# enum member names and the SQL CHECK constraint literals in
    ///     ArchLucid.Persistence/Migrations/269_TechnologyLedgerEntries.sql and Scripts/ArchLucid.sql. If this test fails
    ///     after adding or renaming an enum member, update both SQL CHECK constraints to match.
    /// </summary>
    [Fact]
    public void TechnologyLedgerRole_members_match_sql_check_constraint_literals()
    {
        string[] expected =
        [
            "CloudPlatform", "IdentityProvider", "PrimaryDatastore", "Messaging",
            "ComputeRuntime", "Region", "IacTarget", "Other",
        ];

        Enum.GetNames<TechnologyLedgerRole>().Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void TechnologyLedgerStatus_members_match_sql_check_constraint_literals()
    {
        string[] expected = ["Chosen", "Assumed", "Alternative", "Future"];

        Enum.GetNames<TechnologyLedgerStatus>().Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void TechnologyLedgerSource_members_match_sql_check_constraint_literals()
    {
        string[] expected = ["User", "Evidence", "AgentProposed"];

        Enum.GetNames<TechnologyLedgerSource>().Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void CloudProvider_members_match_sql_check_constraint_literals()
    {
        string[] expected = ["None", "Azure", "Aws", "Gcp"];

        Enum.GetNames<CloudProvider>().Should().BeEquivalentTo(expected);
    }
}
