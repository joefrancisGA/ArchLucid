namespace ArchLucid.Persistence.InfraEvidence;

public sealed record SecurityEvidencePathWithHops(
    SecurityEvidencePathRecord Path,
    IReadOnlyList<SecurityEvidencePathHopRecord> Hops);
