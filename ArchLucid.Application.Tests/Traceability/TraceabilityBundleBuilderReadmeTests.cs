using ArchLucid.Application.Traceability;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Traceability;

[Trait("Suite", "Core")]
public sealed class TraceabilityBundleBuilderReadmeTests
{
    [Fact]
    public void BuildReadmeText_WhenAuditTruncated_IncludesCapHonestyLine()
    {
        string readme = TraceabilityBundleBuilder.BuildReadmeText(auditTruncated: true);

        readme.Should().Contain("capped at 1000 rows");
        readme.Should().Contain("lower bound");
    }

    [Fact]
    public void BuildReadmeText_Always_IncludesSizeCapGuidance()
    {
        string readme = TraceabilityBundleBuilder.BuildReadmeText(auditTruncated: false);

        readme.Should().Contain("HTTP 413");
    }
}
