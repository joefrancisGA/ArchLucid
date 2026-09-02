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

        await _budgetAndConcurrencyStage.ExecuteAsync(state, cancellationToken).ConfigureAwait(false);

        if (state.TerminalResult is not null)
            return state.TerminalResult;

        try
        {
            await _scanInvokeStage.ExecuteAsync(state, cancellationToken).ConfigureAwait(false);

            if (state.TerminalResult is not null && state.TerminalResult.Succeeded)
            {
                await _usageAndAuditStage.RecordSuccessAsync(state, cancellationToken).ConfigureAwait(false);
            }

            return state.TerminalResult ?? QuickScanExecutionResult.ExecutionFailed();
        }
        catch (Exception)
        {
            await _usageAndAuditStage.RecordExecutionFailureAsync(state, cancellationToken).ConfigureAwait(false);

            return QuickScanExecutionResult.ExecutionFailed();
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
