using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-967: anonymous inbound webhook controllers must use the shared bounded body reader before verify/parse.
/// </summary>
[Trait("Suite", "Core")]
public sealed class InboundWebhookBoundedBodyArchitectureTests
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

    [Theory]
    [InlineData("ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs", "_webhookFacade.ProcessAsync")]
    [InlineData("ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs", "HandleWebhookAsync")]
    [InlineData("ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs", "HandleWebhookAsync")]
    [InlineData("ArchLucid.Api/Controllers/Integrations/SlackInteractivityController.cs", "Verify(")]
    public void Inbound_webhook_controller_uses_bounded_reader_before_verify(string relativePath, string verifyToken)
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, relativePath.Replace('/', Path.DirectorySeparatorChar));
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        text.Should().Contain("InboundWebhookBoundedBodyReader");
        text.Should().Contain("InboundWebhookBodyLimits.DefaultMaxUtf8Bytes");
        text.Should().NotContain("ReadToEndAsync");

        int reader = text.IndexOf("InboundWebhookBoundedBodyReader", StringComparison.Ordinal);
        int verify = text.IndexOf(verifyToken, StringComparison.Ordinal);

        reader.Should().BeGreaterThan(0);
        verify.Should().BeGreaterThan(0);
        reader.Should().BeLessThan(verify, because: "size-bounded intake must precede signature/JWT verify");
    }

    [Fact]
    public void Default_max_bytes_matches_ItsmInboundWebhookSyncService_constant()
    {
        string root = FindRepoRoot();
        string limitsPath = Path.Combine(root, "ArchLucid.Api", "Http", "InboundWebhookBodyLimits.cs");
        string itsmPath = Path.Combine(
            root,
            "ArchLucid.Application",
            "Integrations",
            "Itsm",
            "ItsmInboundWebhookSyncService.cs");

        string limits = File.ReadAllText(limitsPath);
        string itsm = File.ReadAllText(itsmPath);

        limits.Should().Contain("DefaultMaxUtf8Bytes = 65536");

        bool hasLiteralConstant = itsm.Contains("MaxInboundWebhookPayloadUtf8Bytes = 65536", StringComparison.Ordinal);
        bool delegatesToSupport = itsm.Contains(
            "ItsmInboundWebhookSyncSupport.MaxInboundWebhookPayloadUtf8Bytes",
            StringComparison.Ordinal);

        (hasLiteralConstant || delegatesToSupport).Should().BeTrue(
            because: "ITSM max payload must remain 65536 via literal or shared support constant");
    }
}
