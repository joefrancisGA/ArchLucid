using ArchLucid.Application.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

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

        if (request.RunId.HasValue && request.RunId.Value != Guid.Empty)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                request.RunId.Value,
                scope,
                _authorityQueryService,
                _manifestHashService,
                ct);
        }

        RecordFindingDispositionRequest normalized = new()
        {
            FindingId = finding.FindingId,
            RunId = request.RunId,
            Disposition = request.Disposition,
            Rationale = request.Rationale,
            TradeOffAcknowledgment = request.TradeOffAcknowledgment,
            RevisitDueUtc = request.RevisitDueUtc,
            EvidenceRequestText = request.EvidenceRequestText,
            ImpactPreviewCompleted = request.ImpactPreviewCompleted,
            PreviewOverrideReason = request.PreviewOverrideReason,
            ArchitectRestatement = request.ArchitectRestatement,
            ExpectedCurrentDispositionRowVersionBase64 = request.ExpectedCurrentDispositionRowVersionBase64,
        };

        return await _findingDispositionService.RecordAsync(
            normalized,
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

        HashSet<Guid> sealedRunIds = findingsInScope
            .Select(static finding => finding.RunId)
            .Where(static runId => runId != Guid.Empty)
            .ToHashSet();

        foreach (Guid runId in sealedRunIds)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                ct);
        }

        List<RecordFindingDispositionRequest> normalizedRequests = new(findingsInScope.Count);
        Dictionary<string, string>? expectedByFindingId = CopyExpectedVersionsByFindingId(
            request.ExpectedCurrentDispositionRowVersionBase64ByFindingId);

        foreach (FindingInspectResponse finding in findingsInScope)
        {
            string normalizedFindingId = finding.FindingId;
            Guid authorityRunId = finding.RunId;

            string? tradeOffAcknowledgment = null;

            if (request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Accepted)
            {
                tradeOffAcknowledgment = string.IsNullOrWhiteSpace(request.TradeOffAcknowledgment)
                    ? request.Rationale
                    : request.TradeOffAcknowledgment;
            }

            string? expectedCurrentDispositionRowVersionBase64 = null;

            if (expectedByFindingId is not null
                && expectedByFindingId.TryGetValue(normalizedFindingId, out string? mappedVersion)
                && !string.IsNullOrWhiteSpace(mappedVersion))
            {
                expectedCurrentDispositionRowVersionBase64 = mappedVersion;
            }

            normalizedRequests.Add(new RecordFindingDispositionRequest
            {
                FindingId = normalizedFindingId,
                RunId = authorityRunId == Guid.Empty ? null : authorityRunId,
                Disposition = request.Disposition,
                Rationale = request.Rationale,
                TradeOffAcknowledgment = tradeOffAcknowledgment,
                RevisitDueUtc = request.RevisitDueUtc,
                EvidenceRequestText = request.EvidenceRequestText,
                ExpectedCurrentDispositionRowVersionBase64 = expectedCurrentDispositionRowVersionBase64,
            });
        }

        if (normalizedRequests.Count == 0)
        {
            throw new ArgumentException(
                "None of the provided findings were found in the current scope.",
                nameof(request.FindingIds));
        }

        IReadOnlyList<FindingDispositionEventDto> recorded = await _findingDispositionService.RecordBulkAsync(
            normalizedRequests,
            scope,
            actorId,
            ct);

        List<string> updated = recorded
            .Select(static dto => dto.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToList();

        Dictionary<string, string> currentByFindingId = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingDispositionEventDto dto in recorded)
        {
            if (string.IsNullOrWhiteSpace(dto.FindingId)
                || string.IsNullOrWhiteSpace(dto.CurrentDispositionRowVersionBase64))
            {
                continue;
            }

            currentByFindingId[dto.FindingId.Trim()] = dto.CurrentDispositionRowVersionBase64;
        }

        return new RecordBulkFindingDispositionResponse
        {
            ProcessedCount = updated.Count,
            UpdatedFindingIds = updated,
            CurrentDispositionRowVersionBase64ByFindingId = currentByFindingId.Count == 0 ? null : currentByFindingId,
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FindingDispositionEventDto>> ListDispositionsAsync(
        string findingId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        FindingInspectResponse? finding = await _findingInspectReadRepository.GetInspectAsync(
            scope,
            findingId.Trim(),
            ct,
            FindingInspectReadOptions.MetadataOnly);

        if (finding is null)
            return [];

        if (finding.RunId != Guid.Empty)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                finding.RunId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                ct);
        }

        return await _findingDispositionService.ListHistoryAsync(scope, finding.FindingId, ct);
    }

    private static Dictionary<string, string>? CopyExpectedVersionsByFindingId(
        IReadOnlyDictionary<string, string>? clientMap)
    {
        if (clientMap is null || clientMap.Count == 0)
        {
            return null;
        }

        Dictionary<string, string> expectedByFindingId = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, string> entry in clientMap)
        {
            if (string.IsNullOrWhiteSpace(entry.Key) || string.IsNullOrWhiteSpace(entry.Value))
            {
                continue;
            }

            expectedByFindingId[entry.Key.Trim()] = entry.Value.Trim();
        }

        return expectedByFindingId.Count == 0 ? null : expectedByFindingId;
    }
}
