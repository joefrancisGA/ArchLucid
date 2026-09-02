using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public sealed class RecurrenceIdentityMatcher(
    IRunDetailQueryService runDetailQueryService,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IPortfolioRecurrenceCurrentReviewIdentitySource? currentReviewIdentitySource) : IRecurrenceIdentityMatcher
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IPortfolioRecurrenceCurrentReviewIdentitySource? _currentReviewIdentitySource =
        currentReviewIdentitySource;

    public async Task<RecurrenceMatchResult> MatchAsync(
        ScopeContext scope,
        GraphSnapshot graphSnapshot,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        CancellationToken cancellationToken)
    {
        Dictionary<string, RecurrenceAccumulator> recurrenceByIdentity = new(StringComparer.Ordinal);
        Dictionary<string, HashSet<string>> identitiesBySystem = new(StringComparer.OrdinalIgnoreCase);
        string currentRunId = graphSnapshot.RunId.ToString("N");

        foreach ((string systemName, RunSummary summary) in scannedSystems)
        {
            if (string.Equals(summary.RunId, currentRunId, StringComparison.OrdinalIgnoreCase))
                continue;

            await AccumulatePersistedSystemIdentitiesAsync(
                scope,
                systemName,
                summary.RunId,
                identitiesBySystem,
                recurrenceByIdentity,
                cancellationToken);
        }

        if (TryGetCurrentSystem(scannedSystems, currentRunId, out string currentSystemName, out RunSummary currentSystemSummary))
        {
            await AccumulatePersistedSystemIdentitiesAsync(
                scope,
                currentSystemName,
                currentSystemSummary.RunId,
                identitiesBySystem,
                recurrenceByIdentity,
                cancellationToken);

            if (!identitiesBySystem.ContainsKey(currentSystemName)
                || identitiesBySystem[currentSystemName].Count == 0)
            {
                AddInFlightIdentitiesForSystem(currentSystemName, identitiesBySystem, recurrenceByIdentity);
            }
        }

        return new RecurrenceMatchResult
        {
            RecurrenceByIdentity = recurrenceByIdentity,
            IdentitiesBySystem = identitiesBySystem,
            ScannedSystemCount = scannedSystems.Count,
        };
    }

    public HashSet<string> ResolveCurrentScopeIdentities(
        GraphSnapshot graphSnapshot,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        IReadOnlyDictionary<string, HashSet<string>> identitiesBySystem)
    {
        string currentRunId = graphSnapshot.RunId.ToString("N");

        if (!TryGetCurrentSystem(scannedSystems, currentRunId, out string currentSystemName, out _))
            return [];

        HashSet<string> identities = [];

        if (identitiesBySystem.TryGetValue(currentSystemName, out HashSet<string>? persistedIdentities))
        {
            foreach (string identity in persistedIdentities)
                identities.Add(identity);
        }

        if (_currentReviewIdentitySource is not null)
        {
            foreach (string identity in _currentReviewIdentitySource.GetIdentities())
                identities.Add(identity);
        }

        return identities;
    }

    private async Task AccumulatePersistedSystemIdentitiesAsync(
        ScopeContext scope,
        string systemName,
        string runId,
        Dictionary<string, HashSet<string>> identitiesBySystem,
        Dictionary<string, RecurrenceAccumulator> recurrenceByIdentity,
        CancellationToken ct)
    {
        FindingsSnapshot? snapshot = await TryLoadFindingsSnapshotAsync(scope, runId, ct).ConfigureAwait(false);

        if (snapshot is null)
            return;

        HashSet<string> systemIdentities = new(StringComparer.Ordinal);
        identitiesBySystem[systemName] = systemIdentities;

        foreach (Finding finding in DeduplicateByMergeKey(snapshot.Findings))
        {
            if (!IsEligiblePortfolioFinding(finding))
                continue;

            string identity = FindingSnapshotMergeKey.FromFinding(finding);
            systemIdentities.Add(identity);
            AddIdentityToRecurrence(systemName, identity, finding, recurrenceByIdentity);
        }
    }

    private void AddInFlightIdentitiesForSystem(
        string systemName,
        Dictionary<string, HashSet<string>> identitiesBySystem,
        Dictionary<string, RecurrenceAccumulator> recurrenceByIdentity)
    {
        if (_currentReviewIdentitySource is null)
            return;

        IReadOnlyCollection<string> inFlightIdentities = _currentReviewIdentitySource.GetIdentities();

        if (inFlightIdentities.Count == 0)
            return;

        if (!identitiesBySystem.TryGetValue(systemName, out HashSet<string>? systemIdentities))
        {
            systemIdentities = new HashSet<string>(StringComparer.Ordinal);
            identitiesBySystem[systemName] = systemIdentities;
        }

        foreach (string identity in inFlightIdentities)
        {
            systemIdentities.Add(identity);

            if (!recurrenceByIdentity.TryGetValue(identity, out RecurrenceAccumulator? accumulator))
                continue;

            accumulator.SystemNames.Add(systemName);
        }
    }

    private static void AddIdentityToRecurrence(
        string systemName,
        string identity,
        Finding finding,
        Dictionary<string, RecurrenceAccumulator> recurrenceByIdentity)
    {
        if (!recurrenceByIdentity.TryGetValue(identity, out RecurrenceAccumulator? accumulator))
        {
            accumulator = new RecurrenceAccumulator(finding);
            recurrenceByIdentity[identity] = accumulator;
        }

        accumulator.SystemNames.Add(systemName);
    }

    private async Task<FindingsSnapshot?> TryLoadFindingsSnapshotAsync(ScopeContext scope, string runId, CancellationToken ct)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailForRoiAsync(runId, ct).ConfigureAwait(false);

        if (detail?.Run.FindingsSnapshotId is not Guid snapshotId || snapshotId == Guid.Empty)
            return null;

        return await _findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, ct).ConfigureAwait(false);
    }

    private static bool TryGetCurrentSystem(
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        string currentRunId,
        out string systemName,
        out RunSummary systemSummary)
    {
        foreach ((string scannedSystemName, RunSummary scannedSystemSummary) in scannedSystems)
        {
            if (!string.Equals(scannedSystemSummary.RunId, currentRunId, StringComparison.OrdinalIgnoreCase))
                continue;

            systemName = scannedSystemName;
            systemSummary = scannedSystemSummary;
            return true;
        }

        systemName = string.Empty;
        systemSummary = null!;
        return false;
    }

    private static IEnumerable<Finding> DeduplicateByMergeKey(IEnumerable<Finding> findings)
    {
        Dictionary<string, Finding> bestByIdentity = new(StringComparer.Ordinal);
        List<string> identityOrder = [];

        foreach (Finding finding in findings)
        {
            string identity = FindingSnapshotMergeKey.FromFinding(finding);

            if (!bestByIdentity.ContainsKey(identity))
            {
                bestByIdentity[identity] = finding;
                identityOrder.Add(identity);
            }
        }

        foreach (string identity in identityOrder)
            yield return bestByIdentity[identity];
    }

    private static bool IsEligiblePortfolioFinding(Finding finding)
    {
        if (finding.IsMuted)
            return false;

        if (finding.Classification == FindingClassification.ChecklistCoverage)
            return false;

        return true;
    }
}
