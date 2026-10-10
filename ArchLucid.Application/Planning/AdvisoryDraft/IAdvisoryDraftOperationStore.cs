using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public interface IAdvisoryDraftOperationStore
{
    AdvisoryDraftOperationCreateResult CreatePending(ScopeContext scope);

    bool TryGet(string operationId, ScopeContext scope, out AdvisoryDraftOperationRecord? record);

    void MarkRunning(ScopeContext scope, string operationId);

    void UpdateProgress(ScopeContext scope, string operationId, string stepLabel, int currentStep);

    void MarkSucceeded(ScopeContext scope, string operationId, DraftArchitectureRequestResponse result);

    void MarkFailed(ScopeContext scope, string operationId, string errorMessage);

    void MarkCanceled(ScopeContext scope, string operationId);
}
