using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanEnvironmentLabelImmutabilityTests
{
    [Fact]
    public void DisplayLabels_CannotChangeAnalysisContext()
    {
        var labels = Assert.IsAssignableFrom<IDictionary<string, string>>(QuickScanPrimaryEnvironment.DisplayLabels);
        Assert.Throws<NotSupportedException>(() => { labels[QuickScanPrimaryEnvironment.Azure] = "AWS"; });
        Assert.Equal("Azure", QuickScanPrimaryEnvironment.ToContextLabel("azure", null));
        Assert.Equal("Google Cloud", QuickScanPrimaryEnvironment.ToContextLabel("googlecloud", null));
    }
}
