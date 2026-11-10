namespace ArchLucid.Api.Tests;

/// <summary>Run id, committed manifest version, and intake request id after the harness finalize golden path.</summary>
public sealed record FinalizedRun(string RunId, string ManifestVersion, string RequestId)
{
    public Guid RunGuid => Guid.Parse(RunId);

    public string SystemName => TestRequestFactory.SystemNameForRequest(RequestId);
}
