using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration.Create.Hooks;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Sequences post-create hook handlers (audit, metering, policy baseline, identity link).
/// </summary>
public sealed class ArchitectureRunCreatePostCreateHooks(
    IArchitectureRunCreateAuditHook auditHook,
    IArchitectureRunCreateMeteringHook meteringHook,
    IArchitectureRunCreatePolicyBaselineHook policyBaselineHook,
    IArchitectureRunCreateIdentityLinkHook identityLinkHook,
    IScopeContextProvider scopeContextProvider)
{
    private readonly IArchitectureRunCreateAuditHook _auditHook =
        auditHook ?? throw new ArgumentNullException(nameof(auditHook));

    private readonly IArchitectureRunCreateMeteringHook _meteringHook =
        meteringHook ?? throw new ArgumentNullException(nameof(meteringHook));

    private readonly IArchitectureRunCreatePolicyBaselineHook _policyBaselineHook =
        policyBaselineHook ?? throw new ArgumentNullException(nameof(policyBaselineHook));

    private readonly IArchitectureRunCreateIdentityLinkHook _identityLinkHook =
        identityLinkHook ?? throw new ArgumentNullException(nameof(identityLinkHook));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task ExecuteAsync(
        ArchitectureRequest request,
        CoordinationResult coordination,
        string actor,
        CancellationToken cancellationToken)
    {
        await _auditHook.LogRequestCreatedAndLockedAsync(request, coordination, actor, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scopeCtx = _scopeContextProvider.GetCurrentScope();
        await _meteringHook.TryRecordArchitectureRunMeteringAsync(scopeCtx, coordination.Run.RunId, cancellationToken)
            .ConfigureAwait(false);
        await _policyBaselineHook.TryApplyCloudPolicyPackBaselineAsync(request, cancellationToken)
            .ConfigureAwait(false);
        await _identityLinkHook.TryLinkReviewRunArchitectureIdentityAsync(
                request,
                coordination.Run.RunId,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
