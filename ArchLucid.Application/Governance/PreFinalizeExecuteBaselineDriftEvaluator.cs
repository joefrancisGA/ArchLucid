using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Detects policy-pack or request drift after execute and before finalize (robustness #9–#10).
/// </summary>
public sealed class PreFinalizeExecuteBaselineDriftEvaluator(
    IEffectiveGovernanceResolver effectiveGovernanceResolver,
    EffectiveGovernanceSnapshotBuilder snapshotBuilder,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IPolicyPackRepository policyPackRepository,
    IPolicyPackVersionRepository policyPackVersionRepository)
{
    private readonly IEffectiveGovernanceResolver _effectiveGovernanceResolver =
        effectiveGovernanceResolver ?? throw new ArgumentNullException(nameof(effectiveGovernanceResolver));

    private readonly EffectiveGovernanceSnapshotBuilder _snapshotBuilder =
        snapshotBuilder ?? throw new ArgumentNullException(nameof(snapshotBuilder));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IPolicyPackVersionRepository _policyPackVersionRepository =
        policyPackVersionRepository ?? throw new ArgumentNullException(nameof(policyPackVersionRepository));

    public async Task<IReadOnlyList<PreFinalizeChecklistItem>> EvaluateAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string? governanceScopeJson,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(governanceScopeJson))
            return [];

        ExecutedEffectiveGovernanceSnapshotDescriptor? snapshot =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(governanceScopeJson);

        if (snapshot is null)
            return [];

        List<PreFinalizeChecklistItem> items = [];

        string currentRequestFingerprint = Convert.ToHexString(ArchitectureRunIdempotencyHashing.FingerprintRequest(request));

        if (!string.IsNullOrWhiteSpace(snapshot.RequestFingerprintHex)
            && !string.Equals(snapshot.RequestFingerprintHex, currentRequestFingerprint, StringComparison.OrdinalIgnoreCase))
        {
            items.Add(new PreFinalizeChecklistItem
            {
                ItemId = "request-changed-since-execute",
                Title = "Review request unchanged since execute",
                Detail =
                    "Constraints, assumptions, or policy references changed after execute. Re-run agents before finalize.",
                Status = PreFinalizeChecklistItemStatus.Blocking,
                Count = 1,
            });
        }

        EffectiveGovernanceSnapshotResolution currentResolution = await _snapshotBuilder.ResolveAsync(
            scope,
            request,
            _effectiveGovernanceResolver,
            _policyPackAssignmentRepository,
            _policyPackRepository,
            preloadedScopePolicyPackAssignments: null,
            cancellationToken,
            _policyPackVersionRepository).ConfigureAwait(false);

        string currentGovernanceHash = HashPackAssignments(currentResolution.PackAssignments);

        if (!string.IsNullOrWhiteSpace(snapshot.GovernanceAssignmentsHashHex)
            && !string.Equals(snapshot.GovernanceAssignmentsHashHex, currentGovernanceHash, StringComparison.OrdinalIgnoreCase))
        {
            items.Add(new PreFinalizeChecklistItem
            {
                ItemId = "policy-pack-changed-since-execute",
                Title = "Policy pack assignments unchanged since execute",
                Detail =
                    "Workspace policy pack assignments changed after execute. Re-run agents or revert assignments before finalize.",
                Status = PreFinalizeChecklistItemStatus.Blocking,
                Count = 1,
            });
        }

        return items;
    }

    internal static string HashPackAssignments(IReadOnlyList<CommittedGovernancePackAssignmentSnapshot> assignments)
    {
        string canonical = JsonSerializer.Serialize(
            assignments
                .OrderBy(static row => row.PolicyPackId)
                .ThenBy(static row => row.PolicyPackVersion, StringComparer.Ordinal)
                .Select(static row => new { row.PolicyPackId, row.PolicyPackVersion, row.ScopeLevel }),
            ContractJson.Default);

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }
}
