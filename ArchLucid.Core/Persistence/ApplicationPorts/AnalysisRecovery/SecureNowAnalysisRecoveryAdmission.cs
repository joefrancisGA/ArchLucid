namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Optional durable handoff written alongside materialized Azure evidence.</summary>
public sealed record SecureNowAnalysisRecoveryAdmission(string InputVersion, bool FullRecompute, int RunTimeoutSeconds);
