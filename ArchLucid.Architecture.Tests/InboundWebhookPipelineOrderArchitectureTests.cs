using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     INV-015 / TB-967 (ITSM inbound): rate limit → bounded size → verify → schema-parse.
/// </summary>
[Trait("Suite", "Core")]
public sealed class InboundWebhookPipelineOrderArchitectureTests
{
    private static string FindRepoRoot()
    {
        for (DirectoryInfo? d = new(AppContext.BaseDirectory); d is not null; d = d.Parent)
        {
            string sln = Path.Combine(d.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return d.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void ItsmInboundWebhooksController_enforces_verify_and_size_before_Json_parse_with_rate_limiting()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Api", "Controllers", "Integrations", "ItsmInboundWebhooksController.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        text.Should().Contain("[EnableRateLimiting(\"fixed\")]");

        AssertMethodOrder(text, "ProcessJiraAsync");
        AssertMethodOrder(text, "ProcessServiceNowAsync");
    }

    private static void AssertMethodOrder(string fileText, string methodName)
    {
        int methodStart = fileText.IndexOf($"async Task<IActionResult> {methodName}(", StringComparison.Ordinal);
        methodStart.Should().BeGreaterThan(0, because: $"{methodName} should exist");

        int nextMethod = fileText.IndexOf("private async Task", methodStart + 1, StringComparison.Ordinal);
        int scopeEnd = nextMethod > 0 ? nextMethod : fileText.Length;
        string methodBody = fileText[methodStart..scopeEnd];

        int sizeCheck = methodBody.IndexOf("InboundWebhookBoundedBodyReader", StringComparison.Ordinal);
        int verify = methodBody.IndexOf("TryVerifyWebhookSecurity", StringComparison.Ordinal);
        int parse = methodBody.IndexOf("TryParseWebhookJson", StringComparison.Ordinal);

        sizeCheck.Should().BeGreaterThan(0);
        verify.Should().BeGreaterThan(0);
        parse.Should().BeGreaterThan(0);

        sizeCheck.Should().BeLessThan(verify, because: "bounded size intake must precede verify (TB-967)");
        verify.Should().BeLessThan(parse, because: "signature/security gate must precede schema parse");
    }
}
