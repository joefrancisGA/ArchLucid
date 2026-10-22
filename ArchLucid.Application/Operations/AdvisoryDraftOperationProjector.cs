using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

internal static class AdvisoryDraftOperationProjector
{
    internal static OperationDetail Project(
        string operationId,
        AdvisoryDraftOperationRecord record,
        bool cancelRequested)
    {
        OperationState state = MapState(record.State, cancelRequested);
        string stepLabel = ResolveStepLabel(record, state);

        OperationResultRef resultRef = new(
            RunId: null,
            JobId: null,
            DownloadPath: record.State == OperationState.Succeeded
                ? BuildResultPath(operationId)
                : null);

        return new OperationDetail(
            operationId,
            state,
            stepLabel,
            record.CurrentStep > 0 ? record.CurrentStep : null,
            record.TotalSteps,
            record.HeartbeatUtc,
            resultRef);
    }

    internal static string BuildResultPath(string operationId)
    {
        if (!OperationIdCodec.TryParse(operationId, out OperationIdKind kind, out string payload)
            || kind != OperationIdKind.Draft)
        {
            return $"/v1/architecture/request/draft/async/result?operationId={Uri.EscapeDataString(operationId)}";
        }

        return $"/v1/architecture/request/draft/async/{payload}/result";
    }

    private static OperationState MapState(OperationState state, bool cancelRequested)
    {
        if (state == OperationState.Canceled)
            return OperationState.Canceled;

        if (cancelRequested && state is OperationState.Pending or OperationState.Running)
            return OperationState.CancelRequested;

        return state;
    }

    private static string ResolveStepLabel(AdvisoryDraftOperationRecord record, OperationState state)
    {
        if (state == OperationState.CancelRequested)
            return "Cancel requested";

        if (state == OperationState.Canceled)
            return AdvisoryDraftOperationSteps.Canceled;

        if (state == OperationState.Failed)
            return AdvisoryDraftOperationSteps.Failed;

        return record.StepLabel;
    }
}
