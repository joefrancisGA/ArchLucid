using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Agents.Evidence;

public sealed class EvidenceProposalPromoter(
    IAgentResultRepository agentResultRepository,
    ITenantCuratedEvidenceRepository curatedEvidenceRepository,
    IScopeContextProvider scopeContextProvider) : IEvidenceProposalPromoter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly ITenantCuratedEvidenceRepository _curatedEvidenceRepository =
        curatedEvidenceRepository ?? throw new ArgumentNullException(nameof(curatedEvidenceRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<Guid> PromoteAsync(string resultId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);

        EvidenceProposalListItem? proposal =
            await _agentResultRepository.TryGetEvidenceProposalAsync(resultId, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException($"No evidence proposal exists for result '{resultId}'.");

        ProposedEvidencePayload payload =
            JsonSerializer.Deserialize<ProposedEvidencePayload>(proposal.ProposedEvidenceJson, JsonOptions)
            ?? throw new InvalidOperationException("Proposed evidence JSON is invalid.");

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            throw new InvalidOperationException("Tenant scope is required to promote evidence proposals.");

        string catalogEntryId = BuildCatalogEntryId(payload.Type, payload.Title);

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

        await _agentResultRepository
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
