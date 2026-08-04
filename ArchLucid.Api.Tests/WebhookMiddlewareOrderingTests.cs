using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     INV-015 / TB-967 (billing webhooks): bounded body intake before provider signature verification.
/// </summary>
[Trait("Category", "Unit")]
public sealed class WebhookMiddlewareOrderingTests
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
    public void BillingStripeWebhookController_reads_bounded_body_before_provider_signature_verification()
    {
        AssertWebhookMethodBuffersBodyBeforeHandler(
            Path.Combine("ArchLucid.Api", "Controllers", "Billing", "BillingStripeWebhookController.cs"),
            "private async Task<IActionResult> HandleStripeWebhookAsync(",
            "HandleWebhookAsync");
    }

    [Fact]
    public void BillingMarketplaceWebhookController_reads_bounded_body_before_provider_signature_verification()
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

        int boundedRead = methodBody.IndexOf("InboundWebhookBoundedBodyReader", StringComparison.Ordinal);
        int handleWebhook = methodBody.IndexOf(handlerCallToken, StringComparison.Ordinal);

        boundedRead.Should().BeGreaterThan(0);
        handleWebhook.Should().BeGreaterThan(0);
        methodBody.Should().NotContain("ReadToEndAsync");

        boundedRead.Should().BeLessThan(handleWebhook);
    }
}
