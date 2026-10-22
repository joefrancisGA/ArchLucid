using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorJsonArrayRootTests
{
    [Fact]
    public void TryCloneRows_returns_empty_array_for_empty_json_array()
    {
        using JsonDocument document = JsonDocument.Parse("[]");

        bool ok = AzureExtractorJsonArrayRoot.TryCloneRows(document.RootElement, out JsonElement[] rows);

        ok.Should().BeTrue();
        rows.Should().BeEmpty();
        AzureExtractorJsonArrayRoot.IsValidOptionalCompanionRoot(document.RootElement).Should().BeTrue();
    }

    [Fact]
    public void TryCloneRows_unwraps_a_single_json_object_as_one_row()
    {
        using JsonDocument document = JsonDocument.Parse("""{"name":"diag1"}""");

        bool ok = AzureExtractorJsonArrayRoot.TryCloneRows(document.RootElement, out JsonElement[] rows);

        ok.Should().BeTrue();
        rows.Should().ContainSingle();
        rows[0].GetProperty("name").GetString().Should().Be("diag1");
        AzureExtractorJsonArrayRoot.IsValidOptionalCompanionRoot(document.RootElement).Should().BeTrue();
    }

    [Fact]
    public void TryCloneRows_preserves_multi_row_arrays()
    {
        using JsonDocument document = JsonDocument.Parse("""[{"name":"a"},{"name":"b"}]""");

        bool ok = AzureExtractorJsonArrayRoot.TryCloneRows(document.RootElement, out JsonElement[] rows);

        ok.Should().BeTrue();
        rows.Should().HaveCount(2);
        rows[0].GetProperty("name").GetString().Should().Be("a");
        rows[1].GetProperty("name").GetString().Should().Be("b");
    }

    [Fact]
    public void TryCloneRows_rejects_non_object_non_array_roots()
    {
        using JsonDocument numberDocument = JsonDocument.Parse("1");
        using JsonDocument stringDocument = JsonDocument.Parse("\"oops\"");
        using JsonDocument nullDocument = JsonDocument.Parse("null");

        AzureExtractorJsonArrayRoot.TryCloneRows(numberDocument.RootElement, out JsonElement[] numberRows)
            .Should()
            .BeFalse();
        numberRows.Should().BeEmpty();
        AzureExtractorJsonArrayRoot.IsValidOptionalCompanionRoot(numberDocument.RootElement).Should().BeFalse();

        AzureExtractorJsonArrayRoot.TryCloneRows(stringDocument.RootElement, out _).Should().BeFalse();
        AzureExtractorJsonArrayRoot.TryCloneRows(nullDocument.RootElement, out _).Should().BeFalse();
    }
}
