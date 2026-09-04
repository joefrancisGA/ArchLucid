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
        string controllerPath = Path.Combine(root, "ArchLucid.Api", "Controllers", "Integrations", "ItsmInboundWebhooksController.cs");
        File.Exists(controllerPath).Should().BeTrue();
        string controller = File.ReadAllText(controllerPath);

        controller.Should().Contain("[EnableRateLimiting(\"fixed\")]");

        int sizeCheck = controller.IndexOf("InboundWebhookBoundedBodyReader", StringComparison.Ordinal);
        int facadeCall = controller.IndexOf("_webhookFacade.ProcessAsync", StringComparison.Ordinal);

        sizeCheck.Should().BeGreaterThan(0);
        facadeCall.Should().BeGreaterThan(0);
        sizeCheck.Should().BeLessThan(facadeCall, because: "bounded size intake must precede facade verify/parse (TB-967)");

        string facadePath = Path.Combine(
            root,
            "ArchLucid.Application",
            "Integrations",
            "Itsm",
            "ItsmInboundWebhookFacade.cs");
        string facade = File.ReadAllText(facadePath);

        int verify = facade.IndexOf("TryVerifyWebhookSecurity", StringComparison.Ordinal);
        int parseCall = facade.IndexOf("TryParseWebhookJson", StringComparison.Ordinal);
        int inlineParse = facade.IndexOf("JsonDocument.Parse", StringComparison.Ordinal);

        verify.Should().BeGreaterThan(0);
        (parseCall > 0 || inlineParse > 0).Should().BeTrue(because: "facade must parse JSON after verify");
        verify.Should().BeLessThan(
            EarliestPositiveIndex(parseCall, inlineParse),
            because: "signature/security gate must precede schema parse");
    }

    private static int EarliestPositiveIndex(int first, int second)
    {
        if (first <= 0)
            return second;

        if (second <= 0)
            return first;

        return Math.Min(first, second);
    }
}
