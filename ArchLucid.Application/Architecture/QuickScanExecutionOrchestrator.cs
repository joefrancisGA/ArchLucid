using ArchLucid.Application.Architecture.Execute;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc cref="IQuickScanExecutionOrchestrator" />
public sealed partial class QuickScanExecutionOrchestrator(
    IQuickScanExecutionPreExecuteStage preExecuteStage,
    IQuickScanExecutionBudgetAndConcurrencyStage budgetAndConcurrencyStage,
    IQuickScanExecutionScanInvokeStage scanInvokeStage,
    IQuickScanExecutionUsageAndAuditStage usageAndAuditStage) : IQuickScanExecutionOrchestrator
{
    private readonly IQuickScanExecutionPreExecuteStage _preExecuteStage =
        preExecuteStage ?? throw new ArgumentNullException(nameof(preExecuteStage));

    private readonly IQuickScanExecutionBudgetAndConcurrencyStage _budgetAndConcurrencyStage =
        budgetAndConcurrencyStage ?? throw new ArgumentNullException(nameof(budgetAndConcurrencyStage));

    private readonly IQuickScanExecutionScanInvokeStage _scanInvokeStage =
        scanInvokeStage ?? throw new ArgumentNullException(nameof(scanInvokeStage));

    private readonly IQuickScanExecutionUsageAndAuditStage _usageAndAuditStage =
        usageAndAuditStage ?? throw new ArgumentNullException(nameof(usageAndAuditStage));
}
