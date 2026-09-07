using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public interface IAdvisoryDraftOperationStore
{
    AdvisoryDraftOperationCreateResult CreatePending(ScopeContext scope);

    bool TryGet(string operationId, ScopeContext scope, out AdvisoryDraftOperationRecord? record);

    void MarkRunning(string operationId);

    void UpdateProgress(string operationId, string stepLabel, int currentStep);

    void MarkSucceeded(string operationId, DraftArchitectureRequestResponse result);

    void MarkFailed(string operationId, string errorMessage);

    void MarkCanceled(string operationId);
}
