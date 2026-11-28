using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TrialSmokeCommandTests
{
    [Theory]
    [InlineData("not-an-absolute-url")]
    [InlineData("ftp://example.invalid")]
    [InlineData("http://")]
    public async Task RunAsync_reports_configuration_error_for_invalid_explicit_api_base_url(string baseUrl)
    {
        int result = await TrialSmokeCommand.RunAsync(
            ["--org", "Smoke Test", "--email", "ops@example.invalid", "--api-base-url", baseUrl]);

        Assert.Equal(CliExitCode.ConfigurationError, result);
    }
}
