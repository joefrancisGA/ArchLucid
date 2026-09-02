using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Applies wave-4/6 create-time pins (policy packs, evidence packages, focused pilot scope) on run headers.
/// </summary>
public interface IRunCreatePinOrchestrator
{
    Task ApplyCreateTimePinsAsync(
        RunRecord header,
        ScopeContext scope,
        ArchitectureRequest request,
        CancellationToken cancellationToken);
}

public sealed class RunCreatePinOrchestrator(
    IRunPolicyPackPinService runPolicyPackPinService,
    IRunEvidencePackagePinService runEvidencePackagePinService,
    IRunGovernanceScopePinService runGovernanceScopePinService) : IRunCreatePinOrchestrator
{
    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    private readonly IRunGovernanceScopePinService _runGovernanceScopePinService =
        runGovernanceScopePinService ?? throw new ArgumentNullException(nameof(runGovernanceScopePinService));

    public async Task ApplyCreateTimePinsAsync(
        RunRecord header,
        ScopeContext scope,
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        await _runPolicyPackPinService.ApplyToRunHeaderAsync(header, scope, cancellationToken).ConfigureAwait(false);
        await _runEvidencePackagePinService.ApplyToRunHeaderAsync(header, scope, request, cancellationToken)
            .ConfigureAwait(false);
        _runGovernanceScopePinService.ApplyFocusedPilotFromRequest(header, request);
    }
}
