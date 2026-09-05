using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="ICommittedEffectiveGovernanceSnapshotCapturer" />
public sealed class CommittedEffectiveGovernanceSnapshotCapturer(
    IScopeContextProvider scopeContextProvider,
    IEffectiveGovernanceResolver effectiveGovernanceResolver,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IPolicyPackRepository policyPackRepository,
    IPolicyPackVersionRepository policyPackVersionRepository) : ICommittedEffectiveGovernanceSnapshotCapturer
{
    private readonly IEffectiveGovernanceResolver _effectiveGovernanceResolver =
        effectiveGovernanceResolver ?? throw new ArgumentNullException(nameof(effectiveGovernanceResolver));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IPolicyPackVersionRepository _policyPackVersionRepository =
        policyPackVersionRepository ?? throw new ArgumentNullException(nameof(policyPackVersionRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly EffectiveGovernanceSnapshotBuilder _snapshotBuilder = new();

    /// <inheritdoc />
    public Task ApplyToManifestAsync(ManifestDocument manifest, CancellationToken cancellationToken = default) =>
        ApplyToManifestAsync(manifest, options: null, cancellationToken);

    /// <inheritdoc />
    public async Task ApplyToManifestAsync(
        ManifestDocument manifest,
        CommittedEffectiveGovernanceSnapshotCaptureOptions? options,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<ArchLucid.Contracts.Governance.PolicyPacks.PolicyPackAssignment> assignments =
            options?.PreloadedScopePolicyPackAssignments
            ?? throw new ConflictException(
                "Commit blocked: effective governance snapshot requires pin-derived policy pack assignments.");

        ArchitectureRequest request = ResolveArchitectureRequest(options);

        EffectiveGovernanceSnapshotResolution resolution = await _snapshotBuilder.ResolveAsync(
            scope,
            request,
            _effectiveGovernanceResolver,
            _policyPackAssignmentRepository,
            _policyPackRepository,
            assignments,
            cancellationToken,
            _policyPackVersionRepository).ConfigureAwait(false);

        manifest.EffectiveGovernanceAtCommit = new CommittedEffectiveGovernanceSnapshotDescriptor
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            RuleSetId = manifest.RuleSetId,
            RuleSetVersion = manifest.RuleSetVersion,
            RuleSetHash = manifest.RuleSetHash,
            ComplianceRuleKeyCount = resolution.ComplianceRuleKeys.Count,
            ComplianceRuleKeys = resolution.ComplianceRuleKeys,
            ConflictCount = resolution.ConflictCount,
            PackAssignments = resolution.PackAssignments,
            CoverageAssignments = resolution.CoverageAssignments,
            HasEffectivePolicy = resolution.HasEffectivePolicy
        };
    }

    private static ArchitectureRequest ResolveArchitectureRequest(CommittedEffectiveGovernanceSnapshotCaptureOptions? options)
    {
        if (options?.PreloadedArchitectureRequest is not null)
            return options.PreloadedArchitectureRequest;

        CloudProvider cloudProvider = options?.PinnedFocusedPilotCloudProvider is int raw
            ? (CloudProvider)raw
            : CloudProvider.None;

        bool focusedPilot = options?.PinnedFocusedPilotModeEnabled == true;

        return new ArchitectureRequest
        {
            CloudProvider = cloudProvider,
            PolicyReferences = focusedPilot
                ? [FocusedPilotModePolicyPacks.ReferenceToken]
                : [],
        };
    }
}
