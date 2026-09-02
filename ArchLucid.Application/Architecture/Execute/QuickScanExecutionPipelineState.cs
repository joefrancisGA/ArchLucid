using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture.Execute;

/// <summary>Mutable execution state passed between Quick Scan execution stage handlers.</summary>
public sealed class QuickScanExecutionPipelineState
{
    public ArchitectureQuickScanRequest? Request { get; init; }

    public required QuickScanExecutionRequestContext Context { get; init; }

    public QuickScanExecutionResult? TerminalResult { get; set; }

    public QuickScanRequestValidator.ValidatedQuickScanRequest? Validated { get; set; }

    public QuickScanOptions Options { get; set; } = new();

    public QuickScanSafetyOptions SafetyOptions { get; set; } = new();

    public QuickScanGuardContext? GuardContext { get; set; }

    public bool UseDistributedIdentityAbuse { get; set; }

    public DateTimeOffset Started { get; set; }

    public decimal ReservedCostUsd { get; set; }

    public Guid? GlobalBudgetReservationId { get; set; }

    public QuickScanDistributedConcurrencyAdmissionResult? ConcurrencyAdmission { get; set; }

    public QuickScanResult? ScanResult { get; set; }

    public TimeSpan ScanDuration { get; set; }

    public decimal EstimatedCostUsd { get; set; }

    public int? InputTokens { get; set; }

    public int? OutputTokens { get; set; }
}
