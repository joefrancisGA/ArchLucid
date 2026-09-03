using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-11 suggestion 106: canonical focused-pilot pin fingerprints for graph reuse and hashers.
/// </summary>
public static class RunHeaderFocusedPilotPinFingerprint
{
    public static string? FormatModeEnabled(bool? enabled) =>
        enabled is null ? null : enabled.Value ? "true" : "false";

    public static string? FormatCloudProvider(int? cloudProvider) =>
        cloudProvider?.ToString();

    public static CloudProvider ResolveCloudProvider(RunRecord? header)
    {
        if (header?.PinnedFocusedPilotCloudProvider is not int raw)
            return CloudProvider.None;

        return (CloudProvider)raw;
    }
}
