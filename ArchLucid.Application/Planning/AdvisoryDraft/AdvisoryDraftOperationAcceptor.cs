using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class AdvisoryDraftOperationAcceptor(
    IAdvisoryDraftOperationStore store,
    AdvisoryDraftOperationQueue queue) : IAdvisoryDraftOperationAcceptor
{
    private readonly IAdvisoryDraftOperationStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly AdvisoryDraftOperationQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    public async Task<string> AcceptAsync(
        DraftArchitectureRequestInput input,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(scope);

        AdvisoryDraftOperationRecord record = _store.CreatePending(scope);
        string operationId = OperationIdCodec.ForDraft(record.OperationId);

        await _queue.EnqueueAsync(
            new AdvisoryDraftOperationWorkItem
            {
                OperationId = operationId,
                Scope = scope,
                Input = input,
            },
            cancellationToken);

        return operationId;
    }
}
