namespace ArchLucid.Api.Tests;

/// <summary>Original finalized run and committed replay run produced by the harness comparison-replay path.</summary>
public sealed record CommittedReplayPair(string RunId, string ReplayRunId);
