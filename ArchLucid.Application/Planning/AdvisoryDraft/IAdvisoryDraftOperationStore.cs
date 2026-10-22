using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public interface IAdvisoryDraftOperationStore
{
    Task<AdvisoryDraftOperationCreateResult> CreatePendingAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<AdvisoryDraftOperationRecord?> GetAsync(
        string operationId,
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task MarkRunningAsync(ScopeContext scope, string operationId, CancellationToken cancellationToken = default);

    Task UpdateProgressAsync(
        ScopeContext scope,
        string operationId,
        string stepLabel,
        int currentStep,
        CancellationToken cancellationToken = default);

    Task MarkSucceededAsync(
        ScopeContext scope,
        string operationId,
        DraftArchitectureRequestResponse result,
        CancellationToken cancellationToken = default);

    Task MarkFailedAsync(
        ScopeContext scope,
        string operationId,
        string errorMessage,
        CancellationToken cancellationToken = default);

    Task MarkCanceledAsync(ScopeContext scope, string operationId, CancellationToken cancellationToken = default);
}
