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

        AdvisoryDraftOperationCreateResult createResult = _store.CreatePending(scope);

        if (!createResult.Created)
        {
            return OperationIdCodec.ForDraft(createResult.Record.OperationId);
        }

        string operationId = OperationIdCodec.ForDraft(createResult.Record.OperationId);

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
