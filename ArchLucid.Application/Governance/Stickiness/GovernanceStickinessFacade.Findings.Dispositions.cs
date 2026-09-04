using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
    /// <inheritdoc />
    public async Task<FindingDispositionEventDto> RecordDispositionAsync(
        RecordFindingDispositionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        FindingInspectResponse finding = await RequireFindingInspectInScopeAsync(scope, request.FindingId, ct);
        EnsureRunMatchesFindingAuthorityRun(request.RunId, finding);
        await EnsureRunInScopeWhenProvidedAsync(scope, request.RunId, ct);

        if (request.RunId is { } dispositionRunId && dispositionRunId != Guid.Empty)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                dispositionRunId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                ct);
        }

        return await _findingDispositionService.RecordAsync(
            request,
            scope,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<RecordBulkFindingDispositionResponse> RecordBulkDispositionAsync(
        RecordBulkFindingDispositionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();
        List<string> normalizedFindingIds = request.FindingIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        List<string> updated = [];
        List<FindingInspectResponse> findingsInScope = [];

        foreach (string normalizedFindingId in normalizedFindingIds)
        {
            FindingInspectResponse finding = await RequireFindingInspectInScopeAsync(scope, normalizedFindingId, ct);
            Guid authorityRunId = finding.RunId;
            EnsureRunMatchesFindingAuthorityRun(
                authorityRunId == Guid.Empty ? null : authorityRunId,
                finding);
            await EnsureRunInScopeWhenProvidedAsync(scope, authorityRunId == Guid.Empty ? null : authorityRunId, ct);
            findingsInScope.Add(finding);
        }

        foreach (FindingInspectResponse finding in findingsInScope)
        {
            string normalizedFindingId = finding.FindingId;
            Guid authorityRunId = finding.RunId;

            if (authorityRunId != Guid.Empty)
            {
                await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                    authorityRunId,
                    scope,
                    _authorityQueryService,
                    _manifestHashService,
                    ct);
            }

            string? tradeOffAcknowledgment = null;

            if (request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Accepted)
            {
                tradeOffAcknowledgment = string.IsNullOrWhiteSpace(request.TradeOffAcknowledgment)
                    ? request.Rationale
                    : request.TradeOffAcknowledgment;
            }

            RecordFindingDispositionRequest normalized = new()
            {
                FindingId = normalizedFindingId,
                RunId = authorityRunId == Guid.Empty ? null : authorityRunId,
                Disposition = request.Disposition,
                Rationale = request.Rationale,
                TradeOffAcknowledgment = tradeOffAcknowledgment,
                RevisitDueUtc = request.RevisitDueUtc,
                EvidenceRequestText = request.EvidenceRequestText,
            };

            await _findingDispositionService.RecordAsync(normalized, scope, actorId, ct);
            updated.Add(normalizedFindingId);
        }

        if (updated.Count == 0)
        {
            throw new ArgumentException(
                "None of the provided findings were found in the current scope.",
                nameof(request.FindingIds));
        }

        return new RecordBulkFindingDispositionResponse
        {
            ProcessedCount = updated.Count,
            UpdatedFindingIds = updated,
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FindingDispositionEventDto>> ListDispositionsAsync(
        string findingId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (!await IsFindingInScopeAsync(scope, findingId, ct))
            return [];

        return await _findingDispositionService.ListHistoryAsync(scope, findingId, ct);
    }
}
