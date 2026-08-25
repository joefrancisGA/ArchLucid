using ArchLucid.Application.Operations;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

internal sealed class StoreAdvisoryDraftProgress(
    IAdvisoryDraftOperationStore store,
    string operationId) : IArchitectureRequestDraftProgress
{
    private readonly IAdvisoryDraftOperationStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly string _operationId =
        string.IsNullOrWhiteSpace(operationId) ? throw new ArgumentException("Operation id is required.", nameof(operationId)) : operationId;

    public void ReportStep(string stepLabel, int currentStep, int totalSteps)
    {
        if (string.IsNullOrWhiteSpace(stepLabel))
            return;

        _store.UpdateProgress(_operationId, stepLabel.Trim(), currentStep);
    }
}
