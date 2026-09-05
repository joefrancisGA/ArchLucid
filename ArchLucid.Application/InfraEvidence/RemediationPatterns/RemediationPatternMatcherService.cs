using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.RemediationPatterns;

public sealed class RemediationPatternMatcherService(
    IOperationalSecurityFindingRepository findingRepository,
    IRemediationPatternRepository patternRepository,
    IRemediationPatternMatchRepository matchRepository,
    ILogger<RemediationPatternMatcherService> logger) : IRemediationPatternMatcherService
{
    public async Task<RemediationPatternMatchEvaluationResult> MatchFindingAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            OperationalSecurityFindingRecord? finding =
                await findingRepository.TryGetByIdAsync(scope.TenantId, findingId, cancellationToken);

            if (finding is null)
            {
                return new RemediationPatternMatchEvaluationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Operational security finding was not found in current tenant scope.",
                };
            }

            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
                await findingRepository.ListMetadataByFindingAsync(scope.TenantId, findingId, cancellationToken);

            IReadOnlyList<RemediationPatternApprovedVersionRecord> approvedVersions =
                await patternRepository.ListApprovedVersionsForTenantAsync(scope.TenantId, cancellationToken);

            IReadOnlyList<RemediationPatternMatchCandidate> candidates =
                RemediationPatternMatcher.Evaluate(finding, metadata, approvedVersions);

            return await PersistEvaluationAsync(scope.TenantId, findingId, candidates, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Remediation pattern matching failed for FindingId={FindingId}.", findingId);
            return new RemediationPatternMatchEvaluationResult
            {
                Succeeded = false,
                ErrorMessage = "Remediation pattern matching failed.",
            };
        }
    }

    public async Task<RemediationPatternMatchEvaluationResult> TryRecordProposedMatchAsync(
        ScopeContext scope,
        Guid findingId,
        Guid patternId,
        string version,
        RemediationPatternMatchKind proposedKind,
        RemediationPatternMatchSource matchSource,
        string explainText,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!RemediationPatternMatchGuard.TryValidateRecordedMatch(proposedKind, matchSource, out string? rejectionReason))
        {
            return new RemediationPatternMatchEvaluationResult
            {
                Succeeded = false,
                RejectionReasons = [rejectionReason!],
                ErrorMessage = rejectionReason,
            };
        }

        RemediationPatternRecord? pattern =
            await patternRepository.TryGetPatternByIdAsync(scope.TenantId, patternId, cancellationToken);

        RemediationPatternVersionRecord? versionRecord =
            await patternRepository.TryGetVersionAsync(scope.TenantId, patternId, version, cancellationToken);

        if (pattern is null || versionRecord is null)
        {
            return new RemediationPatternMatchEvaluationResult
            {
                Succeeded = false,
                ErrorMessage = "Remediation pattern version was not found.",
            };
        }

        if (!RemediationPatternFactoryGuard.TryValidateForFactoryUse(versionRecord, out string? factoryRejection))
        {
            return new RemediationPatternMatchEvaluationResult
            {
                Succeeded = false,
                RejectionReasons = [factoryRejection!],
                ErrorMessage = factoryRejection,
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await matchRepository.DeactivateMatchesForFindingAsync(scope.TenantId, findingId, cancellationToken);

        RemediationPatternMatchResultRecord matchResult = new()
        {
            MatchResultId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            FindingId = findingId,
            PatternId = patternId,
            VersionId = versionRecord.VersionId,
            PatternKey = pattern.PatternKey,
            PatternVersion = versionRecord.Version,
            MatchKind = proposedKind,
            MatchSource = matchSource,
            ExplainText = explainText,
            IsActive = true,
            MatchedUtc = utcNow,
        };

        await matchRepository.InsertMatchResultAsync(matchResult, cancellationToken);

        return new RemediationPatternMatchEvaluationResult
        {
            Succeeded = true,
            FindingId = findingId,
            MatchKind = proposedKind,
            PrimaryMatch = matchResult,
            Candidates = [matchResult],
        };
    }

    private async Task<RemediationPatternMatchEvaluationResult> PersistEvaluationAsync(
        Guid tenantId,
        Guid findingId,
        IReadOnlyList<RemediationPatternMatchCandidate> candidates,
        CancellationToken cancellationToken)
    {
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await matchRepository.DeactivateMatchesForFindingAsync(tenantId, findingId, cancellationToken);

        if (candidates.Count == 0)
        {
            return new RemediationPatternMatchEvaluationResult
            {
                Succeeded = true,
                FindingId = findingId,
                MatchKind = RemediationPatternMatchKind.NoMatch,
            };
        }

        if (RemediationPatternMatcher.TryResolveConflict(candidates, out RemediationPatternMatchConflictType? conflictType, out string? description))
        {
            List<Guid> candidatePatternIds = candidates
                .Where(candidate => candidate.MatchKind == RemediationPatternMatchKind.ExactMatch)
                .Select(candidate => candidate.ApprovedVersion.Pattern.PatternId)
                .Distinct()
                .ToList();

            RemediationPatternMatchConflictRecord conflict = new()
            {
                ConflictId = Guid.NewGuid(),
                TenantId = tenantId,
                FindingId = findingId,
                ConflictType = conflictType!.Value,
                Description = description ?? "Unresolved remediation pattern conflict.",
                CandidatePatternIdsJson = JsonSerializer.Serialize(candidatePatternIds),
                CreatedUtc = utcNow,
            };

            await matchRepository.InsertConflictAsync(conflict, cancellationToken);

            RemediationPatternMatchResultRecord conflictMatch = new()
            {
                MatchResultId = Guid.NewGuid(),
                TenantId = tenantId,
                FindingId = findingId,
                PatternId = candidatePatternIds[0],
                VersionId = candidates[0].ApprovedVersion.Version.VersionId,
                PatternKey = candidates[0].ApprovedVersion.Pattern.PatternKey,
                PatternVersion = candidates[0].ApprovedVersion.Version.Version,
                MatchKind = RemediationPatternMatchKind.Conflict,
                MatchSource = RemediationPatternMatchSource.Deterministic,
                ExplainText = description ?? "Conflict detected among exact matches.",
                IsActive = true,
                MatchedUtc = utcNow,
            };

            await matchRepository.InsertMatchResultAsync(conflictMatch, cancellationToken);

            return new RemediationPatternMatchEvaluationResult
            {
                Succeeded = true,
                FindingId = findingId,
                MatchKind = RemediationPatternMatchKind.Conflict,
                PrimaryMatch = conflictMatch,
                Conflict = conflict,
                Candidates = candidates
                    .Select(candidate => MapCandidate(candidate, tenantId, findingId, utcNow))
                    .ToList(),
            };
        }

        RemediationPatternMatchCandidate primary = candidates[0];
        RemediationPatternMatchResultRecord primaryMatch = MapCandidate(primary, tenantId, findingId, utcNow, isActive: true);
        await matchRepository.InsertMatchResultAsync(primaryMatch, cancellationToken);

        return new RemediationPatternMatchEvaluationResult
        {
            Succeeded = true,
            FindingId = findingId,
            MatchKind = primary.MatchKind,
            PrimaryMatch = primaryMatch,
            Candidates = candidates.Select(candidate => MapCandidate(candidate, tenantId, findingId, utcNow)).ToList(),
        };
    }

    private static RemediationPatternMatchResultRecord MapCandidate(
        RemediationPatternMatchCandidate candidate,
        Guid tenantId,
        Guid findingId,
        DateTime matchedUtc,
        bool isActive = false) =>
        new()
        {
            MatchResultId = Guid.NewGuid(),
            TenantId = tenantId,
            FindingId = findingId,
            PatternId = candidate.ApprovedVersion.Pattern.PatternId,
            VersionId = candidate.ApprovedVersion.Version.VersionId,
            PatternKey = candidate.ApprovedVersion.Pattern.PatternKey,
            PatternVersion = candidate.ApprovedVersion.Version.Version,
            MatchKind = candidate.MatchKind,
            MatchSource = RemediationPatternMatchSource.Deterministic,
            ExplainText = candidate.ExplainText,
            IsActive = isActive,
            MatchedUtc = matchedUtc,
        };
}
