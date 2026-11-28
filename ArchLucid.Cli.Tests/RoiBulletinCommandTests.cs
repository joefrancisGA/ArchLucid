using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RoiBulletinCommandTests
{
    [Theory]
    [InlineData("")]
    [InlineData("{")]
    [InlineData("[]")]
    [InlineData("null")]
    public void ReadPreviewPayload_rejects_undecodable_or_absent_preview(string body)
    {
        Assert.Null(RoiBulletinCommand.ReadPreviewPayload(body));
    }

    [Fact]
    public void ReadPreviewPayload_preserves_valid_aggregate_statistics()
    {
        // Server oracle is RoiBulletinPreviewResponse, serialized as camelCase JSON.
        const string body = """
            {"quarter":"Q1-2026","tenantCount":12,"meanBaselineHours":18.5,"medianBaselineHours":16,"p90BaselineHours":40}
            """;

        var preview = RoiBulletinCommand.ReadPreviewPayload(body);

        Assert.NotNull(preview);
        Assert.Equal("Q1-2026", preview.Quarter);
        Assert.Equal(12, preview.TenantCount);
        Assert.Equal(18.5m, preview.MeanBaselineHours);
        Assert.Equal(16m, preview.MedianBaselineHours);
        Assert.Equal(40m, preview.P90BaselineHours);
    }
}
