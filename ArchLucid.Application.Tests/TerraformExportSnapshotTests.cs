using ArchLucid.Application.TerraformAdvisory;
using FluentAssertions;
using VerifyXunit;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
public sealed class TerraformExportSnapshotTests : VerifyBase
{
    public TerraformExportSnapshotTests() : base()
    {
    }

    private static VerifySettings TerraformSnapshotSettings()
    {
        return new VerifySettings();
    }

    private static string NormalizeForVerifySnapshot(string text)
    {
        return text.ReplaceLineEndings("\n").TrimEnd() + "\n";
    }

    [Fact]
    public Task Terraform_export_blocks_must_contain_advisory_comment_and_lack_destroy()
    {
        string snippet = NormalizeForVerifySnapshot(
            TerraformAdvisorySnippetTemplates.ExampleRightSizeVmSnippet("finding-1", "rec-a"));

        snippet.Should().Contain("# ArchLucid advisory – review before apply");
        snippet.Should().NotContain("destroy");

        return Verify(snippet, TerraformSnapshotSettings());
    }

    [Fact]
    public Task Terraform_export_sanitize_llm_block_rejects_destroy()
    {
        Action act = () => TerraformAdvisorySnippetTemplates.SanitizeLlmTerraformBlock("resource \"azurerm_resource_group\" \"example\" { \n lifecycle { prevent_destroy = false } \n }");
        act.Should().Throw<InvalidOperationException>().WithMessage("*destroy*");

        return Task.CompletedTask;
    }
}
