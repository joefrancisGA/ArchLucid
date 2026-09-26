using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintCompoundIdentifierCommaSemicolonTests
{
    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_semicolon_delimited_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field;encryption;module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_semicolon_delimited_product_name_embedding_sql_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["my;sql;server integration only"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_comma_delimited_slug_without_spaces_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field,encryption,module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_true_when_natural_language_lists_encryption_with_spaced_commas()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Require encryption, private endpoint, and managed identity"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeTrue();
        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresSqlCapability_returns_true_when_natural_language_lists_sql_with_spaced_commas()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["Needs search, sql, and openai services"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeTrue();
        RequestConstraintClassifier.RequiresSearchCapability(request).Should().BeTrue();
        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeTrue();
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
