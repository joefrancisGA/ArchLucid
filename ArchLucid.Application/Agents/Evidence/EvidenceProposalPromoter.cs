using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Agents.Evidence;

public sealed class EvidenceProposalPromoter(
    IAgentResultRepository agentResultRepository,
    IAgentResultEnrichmentRepository agentResultEnrichmentRepository,
    ITenantCuratedEvidenceRepository curatedEvidenceRepository,
    IScopeContextProvider scopeContextProvider,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory) : IEvidenceProposalPromoter
{
    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAgentResultEnrichmentRepository _agentResultEnrichmentRepository =
        agentResultEnrichmentRepository ?? throw new ArgumentNullException(nameof(agentResultEnrichmentRepository));

    private readonly ITenantCuratedEvidenceRepository _curatedEvidenceRepository =
        curatedEvidenceRepository ?? throw new ArgumentNullException(nameof(curatedEvidenceRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    public async Task<Guid> PromoteAsync(string resultId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            throw new InvalidOperationException("Tenant scope is required to promote evidence proposals.");

        EvidenceProposalListItem? proposal =
            await _agentResultRepository.TryGetEvidenceProposalAsync(scope, resultId, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException($"No evidence proposal exists for result '{resultId}'.");

        if (proposal.IsPromoted)
            throw new InvalidOperationException($"Evidence proposal '{resultId}' was already promoted.");

        if (!ProposedEvidencePayloadValidator.TryParseValid(proposal.ProposedEvidenceJson, out ProposedEvidencePayload payload))
            throw new InvalidOperationException("Proposed evidence JSON is invalid.");

        string catalogEntryId = BuildCatalogEntryId(payload.Type, payload.Title);

        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            Guid entryId = uow.SupportsExternalTransaction
                ? await InsertAndMarkPromotedInTransactionAsync(
                    scope,
                    payload,
                    proposal,
                    resultId,
                    catalogEntryId,
                    uow,
                    cancellationToken).ConfigureAwait(false)
                : await InsertAndMarkPromotedWithoutTransactionAsync(
                    scope,
                    payload,
                    proposal,
                    resultId,
                    catalogEntryId,
                    cancellationToken).ConfigureAwait(false);

            await uow.CommitAsync(cancellationToken).ConfigureAwait(false);

            return entryId;
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken).ConfigureAwait(false);
            throw;
        }
    }

    private async Task<Guid> InsertAndMarkPromotedInTransactionAsync(
        ScopeContext scope,
        ProposedEvidencePayload payload,
        EvidenceProposalListItem proposal,
        string resultId,
        string catalogEntryId,
        IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        Guid entryId = await _curatedEvidenceRepository
            .InsertPromotedEntryAsync(
                scope.TenantId,
                payload.Type,
                catalogEntryId,
                payload.Title,
                payload.Description,
                payload.Rationale,
                proposal.ResultId,
                cancellationToken,
                uow.Connection,
                uow.Transaction)
            .ConfigureAwait(false);

        await _agentResultEnrichmentRepository
            .MarkEvidenceProposalPromotedAsync(resultId, cancellationToken, uow.Connection, uow.Transaction)
            .ConfigureAwait(false);

        return entryId;
    }

    private async Task<Guid> InsertAndMarkPromotedWithoutTransactionAsync(
        ScopeContext scope,
        ProposedEvidencePayload payload,
        EvidenceProposalListItem proposal,
        string resultId,
        string catalogEntryId,
        CancellationToken cancellationToken)
    {
        Guid entryId = await _curatedEvidenceRepository
            .InsertPromotedEntryAsync(
                scope.TenantId,
                payload.Type,
                catalogEntryId,
                payload.Title,
                payload.Description,
                payload.Rationale,
                proposal.ResultId,
                cancellationToken)
            .ConfigureAwait(false);

        await _agentResultEnrichmentRepository
            .MarkEvidenceProposalPromotedAsync(resultId, cancellationToken)
            .ConfigureAwait(false);

        return entryId;
    }

    private static string BuildCatalogEntryId(string type, string title)
    {
        string slug = new string(title
            .Trim()
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray())
            .Trim('-');

        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);

        if (slug.Length == 0)
            slug = Guid.NewGuid().ToString("N")[..12];

        return $"{type.ToLowerInvariant()}-{slug}";
    }
}
