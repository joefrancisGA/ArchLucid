using ArchLucid.Contracts.InfraEvidence.DiagramPeel;

namespace ArchLucid.Persistence.Diagrams;

internal static class DiagramPeelCatalogRepositoryCore
{
    internal sealed class EntryDbRow
    {
        public string ArmResourceType
        {
            get;
            init;
        } = string.Empty;

        public int? PeelRank
        {
            get;
            init;
        }

        public bool IsEnabled
        {
            get;
            init;
        }

        public string Notes
        {
            get;
            init;
        } = string.Empty;
    }

    public static DiagramPeelCatalogEntry MapEntry(EntryDbRow row)
    {
        return new DiagramPeelCatalogEntry
        {
            ArmResourceType = row.ArmResourceType,
            PeelRank = row.PeelRank,
            IsEnabled = row.IsEnabled,
            Notes = row.Notes,
        };
    }

    public static DiagramPeelCatalogEntry Clone(DiagramPeelCatalogEntry entry)
    {
        return new DiagramPeelCatalogEntry
        {
            ArmResourceType = entry.ArmResourceType,
            PeelRank = entry.PeelRank,
            IsEnabled = entry.IsEnabled,
            Notes = entry.Notes,
        };
    }
}
