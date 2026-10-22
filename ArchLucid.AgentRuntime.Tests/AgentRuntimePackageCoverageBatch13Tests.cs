using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch13Tests
{
    [Fact]
    public void PromptFieldRedactor_redacts_jwt_azure_and_aws_patterns()
    {
        const string jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
        string raw =
            $"token={jwt}; AccountKey=supersecretaccountkeyvalue; AKIAIOSFODNN7EXAMPLE; " +
            "sig=abc123?sas=1";

        string redacted = PromptFieldRedactor.RedactForPrompt(raw);

        redacted.Should().Contain("[redacted-jwt]");
        redacted.Should().Contain("[redacted-azure-account-key]");
        redacted.Should().Contain("[redacted-aws-access-key-id]");
        redacted.Should().NotContain(jwt);
    }

    [Fact]
    public void PromptFieldRedactor_redacts_luhn_valid_card_and_ssn_shapes()
    {
        string raw = "card 4111-1111-1111-1111 and ssn 123-45-6789";

        string redacted = PromptFieldRedactor.RedactForPrompt(raw);

        redacted.Should().Contain("[redacted-pan-shaped]");
        redacted.Should().Contain("[redacted-ssn-shaped]");
        redacted.Should().NotContain("4111-1111-1111-1111");
    }

    [Fact]
    public void PromptFieldRedactor_redacts_pem_private_key_block()
    {
        const string pem = """
                           -----BEGIN RSA PRIVATE KEY-----
                           MIIEpAIBAAKCAQEA1234567890
                           -----END RSA PRIVATE KEY-----
                           """;

        string redacted = PromptFieldRedactor.RedactForPrompt(pem);

        redacted.Should().Contain("[redacted-pem-private-key]");
        redacted.Should().NotContain("BEGIN RSA PRIVATE KEY");
    }
}
