using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>A single billable node used for infrastructure cost estimation.</summary>
public readonly record struct InfrastructureCostQueryNode(
    string LineKind,
    string DisplayName,
    RuntimePlatform Platform,
    string? ArmRegion,
    string? SkuOrTier,
    int Quantity);
