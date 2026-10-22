namespace ArchLucid.Decisioning.CareerArtifacts;

/// <summary>Named block reason suitable for ProblemDetails and export DTOs (ADR 0078).</summary>
public sealed record CareerArtifactBlockReason(string Code, string Message);
