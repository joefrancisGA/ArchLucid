using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     INV-015 (Stripe billing): raw body is buffered and read before provider signature verification (Improvement #23).
/// </summary>
[Trait("Category", "Unit")]
public sealed class WebhookMiddlewareOrderingTests
{
    private static string FindRepoRoot()
    {
        for (DirectoryInfo? d = new(AppContext.BaseDirectory); d != null; d = d.Parent)
        {
            string sln = Path.Combine(d.FullName, "ArchLucid.sln");

            if (File.Exists(sln))
                return d.FullName;
        }

        throw new InvalidOperationException("ArchLucid.sln not found walking up from AppContext.BaseDirectory.");
    }

    [Fact]
    public void BillingStripeWebhookController_reads_raw_body_before_provider_signature_verification()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Api", "Controllers", "Billing", "BillingStripeWebhookController.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        int methodStart = text.IndexOf("public async Task<IActionResult> StripeAsync(", StringComparison.Ordinal);
        methodStart.Should().BeGreaterThan(0);

        int scopeEnd = text.IndexOf("public ", methodStart + 1, StringComparison.Ordinal);
        if (scopeEnd < 0)
            scopeEnd = text.Length;

        string methodBody = text[methodStart..scopeEnd];

        int enableBuffering = methodBody.IndexOf("EnableBuffering", StringComparison.Ordinal);
        int readBody = methodBody.IndexOf("ReadToEndAsync", StringComparison.Ordinal);
        int handleWebhook = methodBody.IndexOf("HandleWebhookAsync", StringComparison.Ordinal);

        enableBuffering.Should().BeGreaterThan(0);
        readBody.Should().BeGreaterThan(0);
        handleWebhook.Should().BeGreaterThan(0);

        enableBuffering.Should().BeLessThan(readBody);
        readBody.Should().BeLessThan(handleWebhook);
    }
}
