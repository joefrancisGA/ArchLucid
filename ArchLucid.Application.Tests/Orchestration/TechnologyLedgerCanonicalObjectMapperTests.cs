using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class TechnologyLedgerCanonicalObjectMapperTests
{
    private static readonly DateTime FixedUtc = new(2026, 7, 7, 14, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData("azurerm_sql_database", CloudProvider.Azure)]
    [InlineData("aws_db_instance", CloudProvider.Aws)]
    [InlineData("google_sql_database_instance", CloudProvider.Gcp)]
    [InlineData("database", CloudProvider.None)]
    public void InferProviderFamily_maps_type_prefixes(string typeKey, CloudProvider expected)
    {
        TechnologyLedgerCanonicalObjectMapper.InferProviderFamily(typeKey, null).Should().Be(expected);
    }

    [Fact]
    public void MapCanonicalObject_maps_json_database_to_primary_datastore()
    {
        CanonicalObject canonicalObject = new()
        {
            ObjectType = "TopologyResource",
            Name = "orders-db",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["resourceType"] = "database",
                ["region"] = "eastus",
            },
        };

        IReadOnlyList<TechnologyLedgerEntry> entries =
            TechnologyLedgerCanonicalObjectMapper.MapCanonicalObject(canonicalObject, "run123", FixedUtc);

        entries.Should().ContainSingle(entry =>
            entry.Role == TechnologyLedgerRole.PrimaryDatastore
            && entry.TechnologyName == "database (orders-db)"
            && entry.EvidenceRef == "infrastructureDeclaration:decl-1");
    }

    [Fact]
    public void MapCanonicalObject_maps_terraform_type_and_region()
    {
        CanonicalObject canonicalObject = new()
        {
            ObjectType = "TopologyResource",
            Name = "api",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-tf",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_linux_web_app",
                ["tf.location"] = "westeurope",
            },
        };

        IReadOnlyList<TechnologyLedgerEntry> entries =
            TechnologyLedgerCanonicalObjectMapper.MapCanonicalObject(canonicalObject, "run123", FixedUtc);

        entries.Should().Contain(entry => entry.Role == TechnologyLedgerRole.ComputeRuntime && entry.ProviderFamily == CloudProvider.Azure);
        entries.Should().Contain(entry => entry.Role == TechnologyLedgerRole.Region && entry.TechnologyName == "westeurope");
    }

    [Fact]
    public void MapCanonicalObject_returns_empty_for_unmapped_type_without_region()
    {
        CanonicalObject canonicalObject = new()
        {
            ObjectType = "TopologyResource",
            Name = "core-vnet",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-net",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["resourceType"] = "vnet",
            },
        };

        IReadOnlyList<TechnologyLedgerEntry> entries =
            TechnologyLedgerCanonicalObjectMapper.MapCanonicalObject(canonicalObject, "run123", FixedUtc);

        entries.Should().BeEmpty();
    }

    [Fact]
    public void BuildIacTargetEntry_maps_terraform_format()
    {
        TechnologyLedgerEntry entry = TechnologyLedgerCanonicalObjectMapper.BuildIacTargetEntry(
            "terraform-show-json",
            "decl-iac",
            "state.json",
            "run123",
            FixedUtc);

        entry.Role.Should().Be(TechnologyLedgerRole.IacTarget);
        entry.TechnologyName.Should().Be("Terraform");
        entry.EvidenceRef.Should().Be("infrastructureDeclaration:decl-iac");
    }
}
