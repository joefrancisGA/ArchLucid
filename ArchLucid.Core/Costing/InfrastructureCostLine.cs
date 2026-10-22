using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>One line in a monthly infrastructure USD table.</summary>
public sealed record InfrastructureCostLine(
    string LineKind,
    string DisplayName,
    RuntimePlatform Platform,
    string AzureProductLabel,
    decimal EstimatedUsdPerMonth,
    InfrastructureCostPriceSource PriceSource);
