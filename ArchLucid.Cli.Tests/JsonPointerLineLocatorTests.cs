using ArchLucid.Cli;

using FluentAssertions;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class JsonPointerLineLocatorTests
{
    [Theory]
    [InlineData("", "$")]
    [InlineData("#", "$")]
    [InlineData("(root)", "$")]
    [InlineData("#/metadata/manifestVersion", "metadata.manifestVersion")]
    [InlineData("/services/0/name", "services[0].name")]
    [InlineData("#/services/1", "services[1]")]
    public void InstancePointerToNewtonsoftSelectPath_maps_json_pointer_segments(string pointer, string expectedPath)
    {
        JsonPointerLineLocator.InstancePointerToNewtonsoftSelectPath(pointer).Should().Be(expectedPath);
    }

    [Fact]
    public void InstancePointerToNewtonsoftSelectPath_unescapes_tilde_sequences()
    {
        JsonPointerLineLocator.InstancePointerToNewtonsoftSelectPath("#/a~1b~0c").Should().Be("a/b~c");
    }

    [Fact]
    public void TryGetNewtonsoftSourceLine_resolves_line_and_column_for_token()
    {
        JsonLoadSettings settings = new() { LineInfoHandling = LineInfoHandling.Load };
        JToken root = JToken.Parse("""{"metadata": {"manifestVersion": "1"}}""", settings);

        bool found = JsonPointerLineLocator.TryGetNewtonsoftSourceLine(
            root,
            "#/metadata/manifestVersion",
            out int lineNumber,
            out int column);

        found.Should().BeTrue();
        lineNumber.Should().BeGreaterThan(0);
        column.Should().BeGreaterThan(0);
    }

    [Fact]
    public void TryGetNewtonsoftSourceLine_returns_false_for_missing_path()
    {
        JToken root = JToken.Parse("""{"metadata": {}}""");

        bool found = JsonPointerLineLocator.TryGetNewtonsoftSourceLine(
            root,
            "#/missing/path",
            out int lineNumber,
            out int column);

        found.Should().BeFalse();
        lineNumber.Should().Be(0);
        column.Should().Be(0);
    }
}
