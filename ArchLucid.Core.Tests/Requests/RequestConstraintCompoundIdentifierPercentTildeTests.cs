using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintCompoundIdentifierPercentTildeTests
{
    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_percent_delimited_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field%encryption%module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_tilde_delimited_product_name_embedding_sql_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["my~sql~server integration only"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_true_when_constraint_uses_plain_encryption_wording()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Customer-managed keys for encryption workloads"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeTrue();
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
