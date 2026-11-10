namespace ArchLucid.Api.Tests;

/// <summary>Run id and parallel-safe intake request id after architecture request POST.</summary>
public sealed record CreatedRunForTest(string RunId, string RequestId)
{
    public Guid RunGuid => Guid.Parse(RunId);
}
