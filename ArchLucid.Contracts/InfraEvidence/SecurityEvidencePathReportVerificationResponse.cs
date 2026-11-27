using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Contracts.InfraEvidence;

/// <summary>A historical, property-scoped verification observation. It is not a path verdict.</summary>
public sealed record SecurityEvidencePathReportVerificationResponse(
    Guid PathId, Guid ExplanationId, DateTime RecordedUtc, InventoryFalsificationProbe Verification);
