using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     INV-015 (billing webhooks): raw body is buffered and read before provider signature verification.
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
        AssertWebhookMethodBuffersBodyBeforeHandler(
            Path.Combine("ArchLucid.Api", "Controllers", "Billing", "BillingStripeWebhookController.cs"),
            "public async Task<IActionResult> StripeAsync(",
            "HandleWebhookAsync");
    }

    [Fact]
    public void BillingMarketplaceWebhookController_reads_raw_body_before_provider_signature_verification()
    {
        AssertWebhookMethodBuffersBodyBeforeHandler(
            Path.Combine("ArchLucid.Api", "Controllers", "Billing", "BillingMarketplaceWebhookController.cs"),
            "public async Task<IActionResult> MarketplaceAsync(",
            "HandleWebhookAsync");
    }

    private static void AssertWebhookMethodBuffersBodyBeforeHandler(
        string relativeControllerPath,
        string methodSignature,
        string handlerCallToken)
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, relativeControllerPath);
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        int methodStart = text.IndexOf(methodSignature, StringComparison.Ordinal);
        methodStart.Should().BeGreaterThan(0);

        int scopeEnd = text.IndexOf("public ", methodStart + 1, StringComparison.Ordinal);
        if (scopeEnd < 0)
            scopeEnd = text.Length;

        string methodBody = text[methodStart..scopeEnd];

        int enableBuffering = methodBody.IndexOf("EnableBuffering", StringComparison.Ordinal);
        int readBody = methodBody.IndexOf("ReadToEndAsync", StringComparison.Ordinal);
        int handleWebhook = methodBody.IndexOf(handlerCallToken, StringComparison.Ordinal);

        enableBuffering.Should().BeGreaterThan(0);
        readBody.Should().BeGreaterThan(0);
        handleWebhook.Should().BeGreaterThan(0);

        enableBuffering.Should().BeLessThan(readBody);
        readBody.Should().BeLessThan(handleWebhook);
    }
}
