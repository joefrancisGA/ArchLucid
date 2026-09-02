using ArchLucid.Application.Architecture.Execute;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.QuickScan;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
namespace ArchLucid.Application.Tests.Architecture;
internal static class QuickScanExecutionOrchestratorTestFactory {
  public static QuickScanExecutionOrchestrator CreateOrchestrator(
    IQuickScanService quickScanService, IQuickScanGuard quickScanGuard, IQuickScanTelemetry quickScanTelemetry,
    IOptionsMonitor<QuickScanOptions> quickScanOptions, IOptionsMonitor<QuickScanSafetyOptions> quickScanSafetyOptions,
    IQuickScanCostEstimator quickScanCostEstimator, IQuickScanGlobalBudgetReservationService quickScanGlobalBudgetReservationService,
    IQuickScanDistributedConcurrencyService quickScanDistributedConcurrencyService, IQuickScanIdentityAbuseService quickScanIdentityAbuseService,
    IQuickScanSafetyOperationalStateProvider quickScanSafetyOperationalStateProvider, IQuickScanUsageRecorder quickScanUsageRecorder,
    IAuditService auditService, ILlmCostEstimator costEstimator, TimeProvider? timeProvider = null) {
    timeProvider ??= TimeProvider.System;
    using var lf = LoggerFactory.Create(static _ => {});
    var usage = new QuickScanExecutionUsageAndAuditStage(quickScanUsageRecorder, quickScanGlobalBudgetReservationService, quickScanGuard, quickScanTelemetry, auditService, lf.CreateLogger<QuickScanExecutionUsageAndAuditStage>(), timeProvider);
    var pre = new QuickScanExecutionPreExecuteStage(quickScanSafetyOperationalStateProvider, quickScanOptions, quickScanSafetyOptions, quickScanIdentityAbuseService, quickScanGuard, quickScanTelemetry, quickScanUsageRecorder, timeProvider, lf.CreateLogger<QuickScanExecutionPreExecuteStage>());
    var budget = new QuickScanExecutionBudgetAndConcurrencyStage(quickScanCostEstimator, quickScanDistributedConcurrencyService, quickScanGlobalBudgetReservationService, quickScanSafetyOperationalStateProvider, quickScanGuard, quickScanTelemetry, timeProvider);
    var scan = new QuickScanExecutionScanInvokeStage(quickScanService, quickScanGlobalBudgetReservationService, quickScanGuard, quickScanTelemetry, costEstimator, timeProvider);
    return new QuickScanExecutionOrchestrator(pre, budget, scan, usage);
  }
}
