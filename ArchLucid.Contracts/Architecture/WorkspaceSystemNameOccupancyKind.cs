namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Which workspace entity type reserves a system name. Reviews and architectures use separate
///     occupancy namespaces — the same name may label both an architecture and a review.
/// </summary>
public enum WorkspaceSystemNameOccupancyKind
{
    /// <summary>Committed or in-flight review runs.</summary>
    Review = 0,

    /// <summary>Mutable architecture intake drafts.</summary>
    Architecture = 1,
}
