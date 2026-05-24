using ArchLucid.Core.Runs.Finalization;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Maps persistence finalization faults to application-layer exceptions consumed by orchestrators and API mappers.</summary>
internal static class ManifestFinalizationFaultMapper
{
    internal static Exception ToApplicationException(ManifestFinalizationFaultException fault)
    {
        ArgumentNullException.ThrowIfNull(fault);

        return fault.Kind switch
        {
            ManifestFinalizationFaultKind.RunNotFoundOrScope => new RunNotFoundException(fault.RunId.ToString("N")),
            ManifestFinalizationFaultKind.CommittedDifferentManifest
                or ManifestFinalizationFaultKind.BadRunStatus
                or ManifestFinalizationFaultKind.ConcurrencyConflict => new ConflictException(fault.Message),
            ManifestFinalizationFaultKind.FindingsMismatch
                or ManifestFinalizationFaultKind.ArtifactMismatch => new InvalidOperationException(fault.Message, fault),
            _ => fault
        };
    }
}
