using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class AdvisoryDraftOperationAcceptor(
    IAdvisoryDraftOperationStore store,
    AdvisoryDraftOperationQueue queue,
    ILogger<AdvisoryDraftOperationAcceptor>? logger = null) : IAdvisoryDraftOperationAcceptor
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

        AdvisoryDraftOperationCreateResult createResult = await _store.CreatePendingAsync(scope, cancellationToken);

        if (!createResult.Created)
        {
            return OperationIdCodec.ForDraft(createResult.Record.OperationId);
        }

        string operationId = OperationIdCodec.ForDraft(createResult.Record.OperationId);

        try
        {
            await _queue.EnqueueAsync(
                new AdvisoryDraftOperationWorkItem
                {
                    OperationId = operationId,
                    Scope = scope,
                    Input = input,
                },
                cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            try
            {
                await _store.MarkCanceledAsync(scope, operationId, CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Could not close advisory draft operation {OperationId} after canceled queue handoff.",
                    operationId);
            }

            throw;
        }

        return operationId;
    }
}
