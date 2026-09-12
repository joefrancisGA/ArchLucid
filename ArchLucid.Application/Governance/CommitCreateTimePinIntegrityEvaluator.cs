using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Read-side parity for <c>CommitOutputIntegrityService</c> policy/evidence/draft create-time pin checks.
/// </summary>
public static class CommitCreateTimePinIntegrityEvaluator
{
    public static async Task<IReadOnlyList<string>> GetBlockingReasonsAsync(
        ScopeContext scope,
        string runId,
        RunRecord header,
        IRunPolicyPackPinService runPolicyPackPinService,
        IRunEvidencePackagePinService runEvidencePackagePinService,
        IDraftRequestRepository draftRequestRepository,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(runPolicyPackPinService);
        ArgumentNullException.ThrowIfNull(runEvidencePackagePinService);
        ArgumentNullException.ThrowIfNull(draftRequestRepository);

        List<string> reasons = [];

        await TryCollectPinServiceReasonsAsync(
            reasons,
            () => runPolicyPackPinService.VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken))
            .ConfigureAwait(false);

        await TryCollectPinServiceReasonsAsync(
            reasons,
            () => runEvidencePackagePinService.VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken))
            .ConfigureAwait(false);

        DraftRequestResponse? draft = await draftRequestRepository
            .GetBySpawnedRunIdAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId, cancellationToken)
            .ConfigureAwait(false);

        if (draft?.SpawnedDocumentContentHashSha256 is null)
            return reasons;

        byte[] currentHash = DraftDocumentContentFingerprint.Compute(draft.Document);

        if (!DraftDocumentContentFingerprint.SequenceEqual(currentHash, draft.SpawnedDocumentContentHashSha256))
        {
            reasons.Add(
                "Commit blocked: draft document content changed after spawn (SpawnedDocumentContentHashSha256 mismatch).");
        }

        return reasons;
    }

    private static async Task TryCollectPinServiceReasonsAsync(
        List<string> reasons,
        Func<Task> verifyAsync)
    {
        try
        {
            await verifyAsync().ConfigureAwait(false);
        }
        catch (ConflictException ex)
        {
            if (!string.IsNullOrWhiteSpace(ex.Message))
                reasons.Add(ex.Message);
        }
    }
}
