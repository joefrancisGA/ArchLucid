using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorSensitivePropertyRedactorTests
{
    [Theory]
    [InlineData("adminPassword", true)]
    [InlineData("storageAccountAccessKey", true)]
    [InlineData("sshPrivateKey", true)]
    [InlineData("servicePrincipalClientSecret", true)]
    [InlineData("sqlAdminPassword", true)]
    [InlineData("redisPrimaryKey", true)]
    [InlineData("primaryKey", true)]
    [InlineData("connectionString", true)]
    [InlineData("sharedAccessKey", true)]
    [InlineData("signingCertificate", true)]
    [InlineData("signingKey", true)]
    [InlineData("signingCertificatePath", true)]
    [InlineData("clientSecret", true)]
    [InlineData("beefAccessKey", true)]
    public void IsSensitiveKey_detects_realistic_arm_secret_property_names(string key, bool expected)
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(key).Should().Be(expected);
    }

    [Theory]
    [InlineData("location", false)]
    [InlineData("sku", false)]
    [InlineData("adminUsername", false)]
    [InlineData("passwordless", false)]
    [InlineData("PasswordlessAuth", false)]
    [InlineData("nonsecret", false)]
    [InlineData("certificateName", false)]
    public void IsSensitiveKey_ignores_non_secret_inventory_metadata(string key, bool expected)
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(key).Should().Be(expected);
    }

    [Fact]
    public void RedactValue_returns_empty_for_blank_values()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue(null).Should().BeEmpty();
        AzureExtractorSensitivePropertyRedactor.RedactValue("   ").Should().BeEmpty();
    }

    [Fact]
    public void RedactValue_masks_non_blank_values()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue("super-secret").Should().Be("[REDACTED]");
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SensitiveCredentialNameMatcherTests
{
    [Theory]
    [InlineData("adminPassword")]
    [InlineData("OpenAiApiKey")]
    [InlineData("GraphClientSecret")]
    [InlineData("JwtPrivateKeyPemPath")]
    public void IsSensitiveCredentialName_detects_realistic_credential_names(string name)
    {
        SensitiveCredentialNameMatcher.IsSensitiveCredentialName(name).Should().BeTrue();
    }

    [Theory]
    [InlineData("PasswordlessAuth")]
    [InlineData("ApiKeyizerModule")]
    [InlineData("PublicBaseUrl")]
    [InlineData("TokenizerModel")]
    public void IsSensitiveCredentialName_ignores_benign_compound_names(string name)
    {
        SensitiveCredentialNameMatcher.IsSensitiveCredentialName(name).Should().BeFalse();
    }

    [Fact]
    public void Tokenize_splits_camel_case_and_delimiters()
    {
        IReadOnlyList<string> tokens = SensitiveNameTokenizer.Tokenize("ArchLucid:ServiceBus/SharedAccessKey");

        tokens.Should().Equal("arch", "lucid", "service", "bus", "shared", "access", "key");
    }
}
