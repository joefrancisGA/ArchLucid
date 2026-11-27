namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeObservation(
    string ResourceId, string Product, string Vendor, string Distribution,
    string? Version, RuntimeEvidenceKind Kind, string EvidenceId, DateTimeOffset ObservedAt,
    IReadOnlyDictionary<string, RuntimePrerequisiteState> Prerequisites);
