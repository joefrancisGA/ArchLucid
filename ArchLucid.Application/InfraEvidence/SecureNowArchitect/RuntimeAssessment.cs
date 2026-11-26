namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeAssessment(
    RuntimeApplicability Applicability, string ResourceId, string AdvisoryId,
    string RuntimeEvidenceId, string AdvisoryEvidenceId);
