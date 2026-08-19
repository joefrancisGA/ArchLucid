using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftNewCommandOptionsTests
{
    [Fact]
    public void Parse_positive_reads_all_flags()
    {
        DraftNewCommandOptions? options = DraftNewCommandOptions.Parse(
            [
                "--text",
                "Review our Azure API platform for production readiness.",
                "--system-name",
                "Contoso API",
                "--business-outcome",
                "Ship a governed review package for the architecture board.",
                "--api-base-url",
                "https://api.example.test/",
                "--skip-must-questions",
                "--no-auto-execute",
            ],
            out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.IntentText.Should().Contain("Azure API platform");
        options.SystemName.Should().Be("Contoso API");
        options.BusinessOutcome.Should().Contain("architecture board");
        options.ApiBaseUrl.Should().Be("https://api.example.test");
        options.ApiBaseUrlFromArgument.Should().BeTrue();
        options.SkipMustQuestions.Should().BeTrue();
        options.NoAutoExecute.Should().BeTrue();
    }

    [Fact]
    public void Parse_missing_text_value_returns_null()
    {
        DraftNewCommandOptions? options = DraftNewCommandOptions.Parse(["--text"], out string? error);

        options.Should().BeNull();
        error.Should().Contain("--text");
    }

    [Fact]
    public void Parse_unknown_flag_returns_null()
    {
        DraftNewCommandOptions? options = DraftNewCommandOptions.Parse(["--bogus"], out string? error);

        options.Should().BeNull();
        error.Should().Contain("--bogus");
    }
}
