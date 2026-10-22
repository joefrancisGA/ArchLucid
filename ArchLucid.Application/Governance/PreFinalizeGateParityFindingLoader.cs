using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Loads the same persisted plus supplemental finding set that <see cref="PreCommitGovernanceGate"/> evaluates
///     so pre-finalize severity checklist rows stay aligned with the live gate.
/// </summary>
internal static class PreFinalizeGateParityFindingLoader
{
    public static async Task<List<Finding>> LoadAsync(
        string runId,
        ScopeContext scope,
        RunRecord run,
        IFindingsSnapshotRepository findingsSnapshotRepository,
        ITechnologyLedgerRepository technologyLedgerRepository,
        ITechnologyConsistencyFindingEngine technologyConsistencyFindingEngine,
        TechnologyConsistencyFindingEngineOptions consistencyOptions,
        IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
        FindingEvidenceLinkageFindingEngineOptions linkageOptions,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(findingsSnapshotRepository);
        ArgumentNullException.ThrowIfNull(technologyLedgerRepository);
        ArgumentNullException.ThrowIfNull(technologyConsistencyFindingEngine);
        ArgumentNullException.ThrowIfNull(consistencyOptions);
        ArgumentNullException.ThrowIfNull(findingEvidenceLinkageFindingEngine);
        ArgumentNullException.ThrowIfNull(linkageOptions);

        List<Finding> findings = [];

        if (run.FindingsSnapshotId is Guid snapshotId)
        {
            FindingsSnapshot? snapshot =
                await findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, cancellationToken).ConfigureAwait(false);

            if (snapshot?.Findings is { Count: > 0 } snapshotFindings)
                findings = snapshotFindings.ToList();
        }

        await PreCommitSupplementalFindingsAppender.AppendAsync(
            runId,
            scope,
            findings,
            technologyLedgerRepository,
            technologyConsistencyFindingEngine,
            consistencyOptions,
            findingEvidenceLinkageFindingEngine,
            linkageOptions,
            cancellationToken).ConfigureAwait(false);

        return findings;
    }
}
