using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseFullwidthCommaTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_fullwidth_comma_with_space_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\uFF0C identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_compact_fullwidth_comma_forms_compound_slug()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Require managed\uFF0Cidentity-auth for apps"]);

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
