using ArchLucid.Application.Architecture.Execute;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

public sealed partial class QuickScanExecutionOrchestrator
{
    /// <inheritdoc />
    public async Task<QuickScanExecutionResult> ExecuteAsync(
        ArchitectureQuickScanRequest? request,
        QuickScanExecutionRequestContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        QuickScanExecutionPipelineState state = new()
        {
            Request = request,
            Context = context,
        };

        await _preExecuteStage.ExecuteAsync(state, cancellationToken).ConfigureAwait(false);

        if (state.TerminalResult is not null)
            return state.TerminalResult;

        try
        {
            await _budgetAndConcurrencyStage.ExecuteAsync(state, cancellationToken).ConfigureAwait(false);

            if (state.TerminalResult is not null)
                return state.TerminalResult;

            CancellationToken scanCancellationToken =
                state.ConcurrencyAdmission?.ExecutionCancellationToken ?? cancellationToken;

            try
            {
                await _scanInvokeStage.ExecuteAsync(state, scanCancellationToken).ConfigureAwait(false);

                if (state.TerminalResult is not null && state.TerminalResult.Succeeded)
                {
                    await _usageAndAuditStage.RecordSuccessAsync(state, scanCancellationToken).ConfigureAwait(false);
                }

                return state.TerminalResult ?? QuickScanExecutionResult.ExecutionFailed();
            }
            catch (Exception)
            {
                await _usageAndAuditStage.RecordExecutionFailureAsync(state, scanCancellationToken).ConfigureAwait(false);

                return QuickScanExecutionResult.ExecutionFailed();
            }
        }
        finally
        {
            if (state.ConcurrencyAdmission is not null)
            {
                await state.ConcurrencyAdmission.DisposeAsync().ConfigureAwait(false);
            }
        }
    }
}
