using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseUnicodeWhitespaceTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_nonbreaking_space_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u00A0identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_returns_true_when_figure_space_separates_private_endpoint_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Traffic via private\u2007endpoint only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresAiCapability_returns_true_when_nonbreaking_space_follows_openai_phrase()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["Require openai\u00A0cognitive services"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_en_space_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u2002identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_returns_true_when_ideographic_space_separates_private_endpoint_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Traffic via private\u3000endpoint only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_line_separator_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u2028identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_false_when_negation_uses_unicode_space_before_not()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Encryption\u00A0is not required for dev"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_zero_width_space_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u200Bidentity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_false_when_contraction_uses_curly_apostrophe_in_negation()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Encryption isn\u2019t required for dev"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_word_joiner_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u2060identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_soft_hyphen_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u00ADidentity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_en_dash_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u2013identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_nonbreaking_hyphen_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u2011identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_unicode_minus_sign_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u2212identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_middle_dot_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u00B7identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_tab_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\tidentity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_newline_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\nidentity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_false_when_negation_uses_tab_before_is_not()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Encryption\tis not required for dev"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    private static ArchitectureRequest CreateRequest(
        List<string>? constraints = null,
        List<string>? capabilities = null)
    {
        return new ArchitectureRequest
        {
            Description = "architecture request for tests",
            SystemName = "TestSystem",
            Environment = "dev",
            Constraints = constraints ?? [],
            RequiredCapabilities = capabilities ?? [],
        };
    }
}
