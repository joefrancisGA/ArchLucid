using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseSpacedColonEqualsUnderscoreTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_spaced_colon_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed : identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_compact_colon_forms_compound_slug()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed:identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_spaced_equals_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed = identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_compact_equals_forms_compound_slug()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed=identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_spaced_underscore_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed _ identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_compact_underscore_forms_compound_slug()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed_identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_spaced_plus_phrase_has_suffix_negation()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed + identity is not required for dev"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeFalse();
    }

    private static ArchitectureRequest CreateRequest(List<string>? constraints = null)
    {
        return new ArchitectureRequest
        {
            Description = "architecture request for tests",
            SystemName = "TestSystem",
            Environment = "dev",
            Constraints = constraints ?? [],
            RequiredCapabilities = [],
        };
    }
}
