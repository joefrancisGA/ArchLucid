using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceBodyPreviewTests
{
    [Fact]
    public void Format_redacts_connection_style_secret_before_truncation()
    {
        string raw = """{"x":"Password=supersecret;"}""";

        string preview = DeploymentEvidenceBodyPreview.Format(raw, maxChars: 4096);

        preview.Should().Contain("[REDACTED]");
        preview.Should().NotContain("supersecret");
    }

    [Fact]
    public void Format_truncates_long_bodies()
    {
        string raw = new('a', 5000);

        string preview = DeploymentEvidenceBodyPreview.Format(raw, maxChars: 100);

        preview.Length.Should().BeLessThan(raw.Length);
        preview.Should().Contain("truncated");
    }
}
