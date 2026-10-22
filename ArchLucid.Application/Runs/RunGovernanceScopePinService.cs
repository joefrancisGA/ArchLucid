using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-6 suggestion 53: persist focused-pilot scope on the run and restore it during authority pipeline work.
/// </summary>
public interface IRunGovernanceScopePinService
{
    void ApplyFocusedPilotFromRequest(RunRecord header, ArchitectureRequest request);

    IDisposable BeginRestoredScope(RunRecord? header);
}

public sealed class RunGovernanceScopePinService : IRunGovernanceScopePinService
{
    public void ApplyFocusedPilotFromRequest(RunRecord header, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(request);

        bool focusedPilot = FocusedPilotModePolicyPacks.ReferencesIncludeFocusedPilotToken(request.PolicyReferences);
        header.PinnedFocusedPilotModeEnabled = focusedPilot;
        header.PinnedFocusedPilotCloudProvider = focusedPilot ? (int)request.CloudProvider : null;
    }

    public IDisposable BeginRestoredScope(RunRecord? header)
    {
        if (header?.PinnedFocusedPilotModeEnabled != true)
            return NoOpDisposable.Instance;

        CloudProvider cloudProvider = header.PinnedFocusedPilotCloudProvider is int raw
            ? (CloudProvider)raw
            : CloudProvider.None;

        return PilotModeGovernanceScope.Begin(cloudProvider);
    }

    private sealed class NoOpDisposable : IDisposable
    {
        public static readonly NoOpDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
