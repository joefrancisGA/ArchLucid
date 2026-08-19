using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Exports;

/// <summary>Resolves exportable ADR 0052 decision receipts for drafts and committed runs.</summary>
public interface IDecisionReceiptService
{
    Task<DecisionReceiptDocument?> BuildForDraftAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken);

    Task<DecisionReceiptDocument?> BuildForRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken);
}
