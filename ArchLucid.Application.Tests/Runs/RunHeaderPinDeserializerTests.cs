using ArchLucid.Application.Runs;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunHeaderPinDeserializerTests
{
    [Theory]
    [InlineData("[null]")]
    [InlineData("[{\"policyPackId\":\"not-a-guid\",\"policyPackVersion\":\"v1\"}]")]
    [InlineData("[{\"policyPackId\":\"00000000-0000-0000-0000-000000000000\",\"policyPackVersion\":\"v1\"}]")]
    [InlineData("[{\"policyPackId\":\"11111111-1111-1111-1111-111111111111\",\"policyPackVersion\":\"\"}]")]
    public void PolicyPins_RejectMalformedRows(string json)
    {
        Assert.False(RunHeaderPinDeserializer.TryDeserializePolicyPackRows(json, out var rows));
        Assert.Empty(rows);
    }

    [Theory]
    [InlineData("[null]")]
    [InlineData("[{\"provider\":\"\",\"packageId\":\"11111111-1111-1111-1111-111111111111\"}]")]
    [InlineData("[{\"provider\":\"azure-extractor\",\"packageId\":\"00000000-0000-0000-0000-000000000000\"}]")]
    public void EvidencePins_RejectMalformedRows(string json)
    {
        Assert.False(RunHeaderPinDeserializer.TryDeserializeEvidenceRows(json, out var rows));
        Assert.Empty(rows);
    }

    [Fact]
    public void PolicyPins_AcceptValidRow()
    {
        const string json = "[{\"policyPackId\":\"11111111-1111-1111-1111-111111111111\",\"policyPackVersion\":\"v1\"}]";
        Assert.True(RunHeaderPinDeserializer.TryDeserializePolicyPackRows(json, out var rows));
        Assert.Single(rows);
    }

    [Fact]
    public void EvidencePins_AcceptValidRow()
    {
        const string json = "[{\"provider\":\"azure-extractor\",\"packageId\":\"11111111-1111-1111-1111-111111111111\"}]";
        Assert.True(RunHeaderPinDeserializer.TryDeserializeEvidenceRows(json, out var rows));
        Assert.Single(rows);
    }
}
