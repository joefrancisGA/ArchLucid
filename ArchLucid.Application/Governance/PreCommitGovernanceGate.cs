using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <summary>
/// Blocks commit when an enabled assignment sets <see cref="PolicyPackAssignment.BlockCommitOnCritical"/>
/// and the run's findings snapshot contains <see cref="FindingSeverity.Critical"/> rows.
/// </summary>
public sealed class PreCommitGovernanceGate(
    IOptions<PreCommitGovernanceGateOptions> options,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository) : IPreCommitGovernanceGate
{
    private readonly IOptions<PreCommitGovernanceGateOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    /// <inheritdoc />
    public async Task<PreCommitGateResult> EvaluateAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!_options.Value.PreCommitGateEnabled)
        {
            return PreCommitGateResult.Allowed();
        }

        if (!Guid.TryParse(runId, out Guid runKey))
        {
            return PreCommitGateResult.Allowed();
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken);

        if (run is null || !run.FindingsSnapshotId.HasValue)
        {
            return PreCommitGateResult.Allowed();
        }

        IReadOnlyList<PolicyPackAssignment> assignments = await _policyPackAssignmentRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        PolicyPackAssignment? enforcing = assignments
            .Where(static a => a.IsEnabled && a.BlockCommitOnCritical)
            .OrderByDescending(static a => a.AssignedUtc)
            .FirstOrDefault();

        if (enforcing is null)
        {
            return PreCommitGateResult.Allowed();
        }

        FindingsSnapshot? snapshot =
            await _findingsSnapshotRepository.GetByIdAsync(run.FindingsSnapshotId.Value, cancellationToken);

        if (snapshot is null)
        {
            return PreCommitGateResult.Allowed();
        }

        List<string> criticalIds = snapshot.Findings
            .Where(static f => f.Severity == FindingSeverity.Critical)
            .Select(static f => f.FindingId)
            .ToList();

        if (criticalIds.Count == 0)
        {
            return PreCommitGateResult.Allowed();
        }

        string packLabel = enforcing.PolicyPackId.ToString("N");

        return new PreCommitGateResult
        {
            Blocked = true,
            Reason =
                $"{criticalIds.Count} Critical finding(s) block commit per policy pack assignment (pack {packLabel}).",
            BlockingFindingIds = criticalIds,
            PolicyPackId = packLabel,
        };
    }
}
