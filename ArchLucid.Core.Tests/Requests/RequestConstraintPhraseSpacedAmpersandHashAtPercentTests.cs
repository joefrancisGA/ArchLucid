using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseSpacedAmpersandHashAtPercentTests
{
    [Theory]
    [InlineData("Use managed & identity for Key Vault", '&', "managed&identity")]
    [InlineData("Use managed # identity for Key Vault", '#', "managed#identity")]
    [InlineData("Use managed @ identity for Key Vault", '@', "managed@identity")]
    [InlineData("Use managed % identity for Key Vault", '%', "managed%identity")]
    public void HasManagedIdentityConstraint_returns_true_when_spaced_delimiter_separates_words(
        string constraint,
        char _,
        string compactSlug)
    {
        ArchitectureRequest spaced = CreateRequest(constraints: [constraint]);
        RequestConstraintClassifier.HasManagedIdentityConstraint(spaced).Should().BeTrue();

        ArchitectureRequest compact = CreateRequest(constraints: [$"Use {compactSlug} for Key Vault"]);
        RequestConstraintClassifier.HasManagedIdentityConstraint(compact).Should().BeFalse();
    }

    [Fact]
    public void HasManagedIdentityConstraint_returns_false_when_spaced_colon_phrase_has_suffix_negation()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed : identity is not required for dev"]);

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
