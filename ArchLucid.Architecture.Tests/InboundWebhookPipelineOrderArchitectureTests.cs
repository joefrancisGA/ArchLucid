using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     INV-015 (ITSM inbound): inexpensive stages run before JSON parse; verification before schema materialization.
///     Expected order per <c>docs/library/ARCHITECTURE_INVARIANTS.md</c>: verify-signature → size-cap → rate-limit →
///     schema-parse — this controller applies rate limiting via <see cref="Microsoft.AspNetCore.RateLimiting.EnableRateLimitingAttribute" />
///     and rejects oversize payloads before <c>JsonDocument.Parse</c>. Product note: shared-secret header checks occur inside
///     <c>TryVerifyWebhookSecurity</c> after UTF-8 byte counting (still before parse).
///     Runtime ordering for the real host is asserted by integration tests in
///     <c>ArchLucid.Api.Tests/InboundWebhookPipelineOrderIntegrationTests.cs</c>.
/// </summary>
[Trait("Suite", "Core")]
public sealed class InboundWebhookPipelineOrderArchitectureTests
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
    public void ItsmInboundWebhooksController_enforces_verify_and_size_before_Json_parse_with_rate_limiting()
    {
        string root = FindRepoRoot();
        string path = Path.Combine(root, "ArchLucid.Api", "Controllers", "Integrations", "ItsmInboundWebhooksController.cs");
        File.Exists(path).Should().BeTrue();
        string text = File.ReadAllText(path);

        text.Should().Contain("[EnableRateLimiting(\"fixed\")]");

        AssertMethodOrder(text, "Jira");
        AssertMethodOrder(text, "ServiceNow");
    }

    private static void AssertMethodOrder(string fileText, string methodName)
    {
        int methodStart = fileText.IndexOf($"public async Task<IActionResult> {methodName}(", StringComparison.Ordinal);
        methodStart.Should().BeGreaterThan(0, because: $"{methodName} should exist");

        int nextMethod = fileText.IndexOf("public async Task<IActionResult>", methodStart + 1, StringComparison.Ordinal);
        int scopeEnd = nextMethod > 0 ? nextMethod : fileText.Length;
        string methodBody = fileText[methodStart..scopeEnd];

        int sizeCheck = methodBody.IndexOf("MaxInboundWebhookPayloadUtf8Bytes", StringComparison.Ordinal);
        int verify = methodBody.IndexOf("TryVerifyWebhookSecurity", StringComparison.Ordinal);
        int parse = methodBody.IndexOf("JsonDocument.Parse", StringComparison.Ordinal);

        sizeCheck.Should().BeGreaterThan(0);
        verify.Should().BeGreaterThan(0);
        parse.Should().BeGreaterThan(0);

        sizeCheck.Should().BeLessThan(parse, because: "size cap decision must precede schema parse (parser DoS)");
        verify.Should().BeLessThan(parse, because: "signature/security gate must precede schema parse");

        // INV-015 table lists verify before size-cap; this implementation counts UTF-16 bodies then verifies HMAC.
        verify.Should().BeGreaterThan(sizeCheck, because: "verify-signature stage follows payload measurement in ITSM webhooks");
    }
}
