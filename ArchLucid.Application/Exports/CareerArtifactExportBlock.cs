namespace ArchLucid.Application.Exports;

/// <summary>Named ADR 0078 block surfaced on career export endpoints (FC-08).</summary>
public sealed record CareerArtifactExportBlock(string Code, string Message);
