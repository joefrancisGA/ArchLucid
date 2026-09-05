namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed class PolicyPackCreateBody
{
    public required string Name { get; init; }

    public string Description { get; init; } = "";

    public required string PackType { get; init; }

    public string InitialContentJson { get; init; } = "{}";
}

public sealed class PolicyPackPublishBody
{
    public required string Version { get; init; }

    public required string ContentJson { get; init; }
}

public sealed class PolicyPackAssignBody
{
    public required string Version { get; init; }

    public string? ScopeLevel { get; init; }

    public bool IsPinned { get; init; }

    public bool IsOrganizationRequired { get; init; }
}

public sealed class PolicyPackPromoteCatalogBody
{
    public required Guid SourcePolicyPackId { get; init; }

    public string? Version { get; init; }
}

public sealed class PolicyPackDemoteCatalogBody
{
    public required Guid PolicyPackCatalogEntryId { get; init; }
}
