using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IQuickScanExecutionOrchestrator" />
public sealed partial class QuickScanExecutionOrchestrator(
    IQuickScanService quickScanService,
    IQuickScanGuard quickScanGuard,
    IQuickScanTelemetry quickScanTelemetry,
    IOptionsMonitor<QuickScanOptions> quickScanOptions,
    IOptionsMonitor<QuickScanSafetyOptions> quickScanSafetyOptions,
    IQuickScanCostEstimator quickScanCostEstimator,
    IQuickScanGlobalBudgetReservationService quickScanGlobalBudgetReservationService,
    IQuickScanDistributedConcurrencyService quickScanDistributedConcurrencyService,
    IQuickScanIdentityAbuseService quickScanIdentityAbuseService,
    IQuickScanSafetyOperationalStateProvider quickScanSafetyOperationalStateProvider,
    IQuickScanUsageRecorder quickScanUsageRecorder,
    IAuditService auditService,
    ILlmCostEstimator costEstimator,
    ILogger<QuickScanExecutionOrchestrator> logger,
    TimeProvider timeProvider) : IQuickScanExecutionOrchestrator
{
    private readonly IQuickScanUsageRecorder _quickScanUsageRecorder =
        quickScanUsageRecorder ?? throw new ArgumentNullException(nameof(quickScanUsageRecorder));
}
