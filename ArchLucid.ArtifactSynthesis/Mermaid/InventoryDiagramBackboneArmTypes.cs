using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>
/// Product resources Full subscription must keep after peeling attachments.
/// SQL databases are ARM child types, so implicit child peel would hide them without this list.
/// </summary>
internal static class InventoryDiagramBackboneArmTypes
{
    public const string CollapseKind = "BackboneKeep";
    public const string ViewMarker = "al-view=backbone-keep";
    public const string TitleSuffix = DiagramAstFromGraphCompilerConstants.BackboneKeepTitleSuffix;
    public const string Caption =
        "This diagram keeps virtual machines, databases, networks, and other backbone resources. Attachment and platform resources are hidden. Pick a Resource Group to see every resource in one group.";

    /// <summary>
    /// Extra never-peel types beyond the SQL catalog seed. Kept in code so existing
    /// catalog rows still protect databases after an upgrade that has not re-seeded SQL.
    /// </summary>
    public static readonly string[] ExtraNeverPeelArmTypes =
    [
        "Microsoft.Sql/servers/databases",
        "Microsoft.Sql/managedInstances",
        "Microsoft.DBforPostgreSQL/flexibleServers",
        "Microsoft.DBforPostgreSQL/servers",
        "Microsoft.DBforMySQL/flexibleServers",
        "Microsoft.DBforMySQL/servers",
        "Microsoft.DocumentDB/databaseAccounts",
        "Microsoft.Cache/Redis",
        "Microsoft.Compute/virtualMachineScaleSets",
        "Microsoft.ContainerService/managedClusters",
        "Microsoft.Web/serverFarms",
        "Microsoft.KeyVault/vaults",
    ];

    public static bool TitleMarksBackboneKeep(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return false;
        }

        return title.Contains(TitleSuffix, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsNeverPeelArmType(string? armType, DiagramPeelCatalogSnapshot catalog)
    {
        ArgumentNullException.ThrowIfNull(catalog);

        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        bool catalogNeverPeel = catalog.Entries.Any(entry =>
            entry.IsEnabled
            && entry.PeelRank is null
            && string.Equals(entry.ArmResourceType, armType, StringComparison.OrdinalIgnoreCase));

        if (catalogNeverPeel)
        {
            return true;
        }

        return ExtraNeverPeelArmTypes.Contains(armType, StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsBackboneTopologyArmType(string? armType, DiagramPeelCatalogSnapshot catalog)
    {
        if (IsNeverPeelArmType(armType, catalog))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        // Data-plane product types (SQL, Cosmos, PostgreSQL) stay visible even when not catalogued.
        return string.Equals(
            AzureInventoryTopologyCategory.Resolve(armType),
            GraphTopologyCategories.Data,
            StringComparison.OrdinalIgnoreCase);
    }
}
