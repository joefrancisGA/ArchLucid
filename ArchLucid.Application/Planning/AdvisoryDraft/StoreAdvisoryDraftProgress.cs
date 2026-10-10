using ArchLucid.Application.Operations;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

internal sealed class StoreAdvisoryDraftProgress(
    IAdvisoryDraftOperationStore store,
    ScopeContext scope,
    string operationId) : IArchitectureRequestDraftProgress
{
    private readonly IAdvisoryDraftOperationStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly ScopeContext _scope =
        scope ?? throw new ArgumentNullException(nameof(scope));

    private readonly string _operationId =
        string.IsNullOrWhiteSpace(operationId) ? throw new ArgumentException("Operation id is required.", nameof(operationId)) : operationId;

    public void ReportStep(string stepLabel, int currentStep, int totalSteps)
    {
        if (string.IsNullOrWhiteSpace(stepLabel))
            return;

        _store.UpdateProgress(_scope, _operationId, stepLabel.Trim(), currentStep);
    }
}
