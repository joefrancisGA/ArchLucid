using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Appends technology-consistency and evidence-linkage supplemental findings used by both live pre-commit
///     evaluation and proposed-pack governance dry-run so operators preview the same blocking set.
/// </summary>
internal static class PreCommitSupplementalFindingsAppender
{
    public static async Task AppendAsync(
        string runId,
        ScopeContext scope,
        List<Finding> findings,
        ITechnologyLedgerRepository technologyLedgerRepository,
        ITechnologyConsistencyFindingEngine technologyConsistencyFindingEngine,
        TechnologyConsistencyFindingEngineOptions consistencyOptions,
        IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
        FindingEvidenceLinkageFindingEngineOptions linkageOptions,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(technologyLedgerRepository);
        ArgumentNullException.ThrowIfNull(technologyConsistencyFindingEngine);
        ArgumentNullException.ThrowIfNull(consistencyOptions);
        ArgumentNullException.ThrowIfNull(findingEvidenceLinkageFindingEngine);
        ArgumentNullException.ThrowIfNull(linkageOptions);

        await AppendTechnologyConsistencyFindingsAsync(
            runId,
            scope,
            findings,
            technologyLedgerRepository,
            technologyConsistencyFindingEngine,
            consistencyOptions,
            cancellationToken).ConfigureAwait(false);

        AppendEvidenceLinkageFindings(
            runId,
            findings,
            findingEvidenceLinkageFindingEngine,
            linkageOptions);
    }

    private static async Task AppendTechnologyConsistencyFindingsAsync(
        string runId,
        ScopeContext scope,
        List<Finding> findings,
        ITechnologyLedgerRepository technologyLedgerRepository,
        ITechnologyConsistencyFindingEngine technologyConsistencyFindingEngine,
        TechnologyConsistencyFindingEngineOptions consistencyOptions,
        CancellationToken cancellationToken)
    {
        consistencyOptions.Normalize();

        if (!consistencyOptions.Enabled)
            return;

        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<Finding> consistencyFindings =
            technologyConsistencyFindingEngine.Evaluate(runId, ledgerEntries, consistencyOptions);

        if (consistencyFindings.Count == 0)
            return;

        findings.AddRange(consistencyFindings);
    }

    private static void AppendEvidenceLinkageFindings(
        string runId,
        List<Finding> findings,
        IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
        FindingEvidenceLinkageFindingEngineOptions linkageOptions)
    {
        if (!linkageOptions.Enabled)
            return;

        IReadOnlyList<Finding> linkageFindings = findingEvidenceLinkageFindingEngine.Evaluate(runId, findings);

        if (linkageFindings.Count == 0)
            return;

        foreach (Finding linkageFinding in linkageFindings)
        {
            if (linkageOptions.WarnOnly)
                linkageFinding.Severity = FindingSeverity.Warning;

            findings.Add(linkageFinding);
        }
    }
}
