using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Unit coverage for <see cref="PolicyPackSchemaKeysService" /> schema introspection.
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPackSchemaKeysServiceTests
{
    [SkippableFact]
    public void GetSchemaKeys_ReturnsAllTopLevelPolicyPackContentProperties()
    {
        PolicyPackSchemaKeysService sut = new();

        PolicyPackSchemaKeysResponse response = sut.GetSchemaKeys();

        response.Keys.Should().NotBeEmpty();
        response.Tree.Should().NotBeEmpty();

        response.Keys.Select(static key => key.Path).Should().Contain(
        [
            "complianceRuleIds",
            "complianceRuleKeys",
            "alertRuleIds",
            "compositeAlertRuleIds",
            "advisoryDefaults",
            "metadata",
            "advisoryDefaults.{key}",
            "metadata.{key}"
        ]);

        PolicyPackSchemaKeyDescriptor complianceRuleIds = response.Keys.Single(key => key.Path == "complianceRuleIds");
        complianceRuleIds.JsonType.Should().Be("array");
        complianceRuleIds.ValueType.Should().Be("string");
        complianceRuleIds.ValueFormat.Should().Be("uuid");

        PolicyPackSchemaKeyDescriptor advisoryDefaults = response.Keys.Single(key => key.Path == "advisoryDefaults");
        advisoryDefaults.JsonType.Should().Be("object");
        advisoryDefaults.AllowsCustomKeys.Should().BeTrue();

        PolicyPackSchemaKeyNode metadataNode = response.Tree.Single(node => node.Name == "metadata");
        metadataNode.AllowsCustomKeys.Should().BeTrue();
        metadataNode.Children.Should().ContainSingle().Which.Name.Should().Be("{key}");
    }

    [SkippableFact]
    public void GetContentDocumentJsonSchema_ReturnsObjectSchemaWithTopLevelProperties()
    {
        PolicyPackSchemaKeysService sut = new();

        PolicyPackContentDocumentJsonSchemaResponse response = sut.GetContentDocumentJsonSchema();

        response.Schema.ValueKind.Should().Be(JsonValueKind.Object);
        response.Schema.TryGetProperty("type", out JsonElement type).Should().BeTrue();
        type.GetString().Should().Be("object");
        response.Schema.TryGetProperty("properties", out JsonElement properties).Should().BeTrue();
        properties.TryGetProperty("complianceRuleIds", out _).Should().BeTrue();
        properties.TryGetProperty("metadata", out _).Should().BeTrue();
    }
}
