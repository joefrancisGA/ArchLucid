using ArchLucid.ContextIngestion.Diagram;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class SvgDiagramSanitizerTests
{
    [Fact]
    public void Sanitize_StripsOnclickAndScriptElements()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg">
              <script>alert(1)</script>
              <rect id="api" onclick="evil()" x="0" y="0" width="10" height="10"/>
            </svg>
            """;

        SvgDiagramSanitizeResult result = SvgDiagramSanitizer.Sanitize(svg);

        result.SanitizedContent.Should().NotContain("onclick");
        result.SanitizedContent.Should().NotContain("<script");
        result.Warnings.Should().Contain(warning => warning.Contains("onclick", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Sanitize_RemovesForeignObject()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg">
              <foreignObject><div>html</div></foreignObject>
              <rect id="api" x="0" y="0" width="10" height="10"/>
            </svg>
            """;

        SvgDiagramSanitizeResult result = SvgDiagramSanitizer.Sanitize(svg);

        result.SanitizedContent.Should().NotContain("foreignObject");
    }

    [Fact]
    public void Sanitize_RejectsXxeEntityExpansion()
    {
        const string svg = """
            <?xml version="1.0"?>
            <!DOCTYPE svg [
              <!ENTITY xxe "evil">
            ]>
            <svg xmlns="http://www.w3.org/2000/svg"><text>&xxe;</text></svg>
            """;

        SvgDiagramSanitizeResult result = SvgDiagramSanitizer.Sanitize(svg);

        result.SanitizedContent.Should().BeEmpty();
        result.Warnings.Should().Contain(warning => warning.Contains("SVG XML parse failed", StringComparison.Ordinal));
    }
}
