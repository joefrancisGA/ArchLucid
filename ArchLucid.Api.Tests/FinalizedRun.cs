namespace ArchLucid.Api.Tests;

/// <summary>Run id and committed manifest version after the harness finalize golden path.</summary>
public sealed record FinalizedRun(string RunId, string ManifestVersion);
