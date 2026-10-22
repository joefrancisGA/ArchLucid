namespace ArchLucid.Core.Configuration;

/// <summary>Conservative USD reservation breakdown for a single Quick Scan request.</summary>
public sealed class QuickScanReservedCostBreakdown
{
    public required string ModelId { get; init; }

    public required int ReservedInputTokens { get; init; }

    public required int ReservedOutputTokens { get; init; }

    public required decimal BaseUsd { get; init; }

    public required decimal RetryExposureUsd { get; init; }

    public required decimal FallbackExposureUsd { get; init; }

    public required decimal TotalReservedUsd { get; init; }
}
