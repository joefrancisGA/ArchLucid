namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Runtime vulnerabilities are distinct from malicious package releases. A configured
// stack or available platform patch is not proof of the running runtime.
internal enum RuntimeApplicability { Unknown, Affected, OutsideAffectedRange, PrerequisiteAbsent }
