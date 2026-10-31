using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseSpacedPlusTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_spaced_plus_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed + identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_compact_plus_forms_compound_slug()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed+identity for Key Vault"]);

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
