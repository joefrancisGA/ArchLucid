namespace ArchLucid.Contracts.InfraEvidence;

/// <summary>A local citation to an inventory resource row, never a raw source URL or a premium path ID.</summary>
public sealed record PublicIpAssessmentEvidence(Guid ResourceRowId, string Kind, string Provenance);
