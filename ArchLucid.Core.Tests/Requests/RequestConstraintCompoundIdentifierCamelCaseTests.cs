using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintCompoundIdentifierCamelCaseTests
{
    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_pascal_case_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["FieldEncryptionModule integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresAiCapability_does_not_false_positive_on_pascal_case_product_name_embedding_openai_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["EmailOpenAiGateway integration only"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresAiCapability_does_not_false_positive_on_camel_case_product_name_embedding_ai_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["emailAiGateway integration only"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeFalse();
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
