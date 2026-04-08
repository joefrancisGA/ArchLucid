using ArchLucidFindingEngine;

namespace ArchLucidFindingEngine.Tests;

public sealed class SampleFindingTests
{
    [Fact]
    public void Describe_returns_marker()
    {
        string s = SampleFinding.Describe();

        Assert.Equal("archlucid-finding-engine", s);
    }
}
