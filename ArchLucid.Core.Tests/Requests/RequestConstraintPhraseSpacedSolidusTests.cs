using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseSpacedSolidusTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_ascii_solidus_with_spaces_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed / identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_returns_true_when_ascii_solidus_with_spaces_splits_private_endpoint_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Traffic via private / endpoint only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_ascii_comma_with_spaces_splits_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Require managed, identity authentication"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_returns_true_when_ascii_comma_with_spaces_splits_private_endpoint_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use private, endpoint access only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_ascii_slash_forms_compact_compound_slug()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Require managed/identity-auth for apps"]);

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
