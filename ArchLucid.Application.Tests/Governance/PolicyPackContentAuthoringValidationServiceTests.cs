using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Unit coverage for <see cref="PolicyPackContentAuthoringValidationService" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackContentAuthoringValidationServiceTests
{
    [Fact]
    public async Task ValidateAsync_when_document_valid_returns_summary_and_no_errors()
    {
        PolicyPackContentAuthoringValidationService sut = CreateSut(["network-must-have-security-baseline"]);

        PolicyPackContentDocument document = new()
        {
            ComplianceRuleKeys = ["network-must-have-security-baseline"],
        };

        PolicyPackContentValidationResponse response = await sut.ValidateAsync(document, CancellationToken.None);

        response.Valid.Should().BeTrue();
        response.Summary.ComplianceRuleKeyCount.Should().Be(1);
        response.Issues.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateAsync_when_unknown_rule_key_emits_warning_not_error()
    {
        PolicyPackContentAuthoringValidationService sut = CreateSut(["known-rule"]);

        PolicyPackContentDocument document = new()
        {
            ComplianceRuleKeys = ["unknown-custom-rule"],
        };

        PolicyPackContentValidationResponse response = await sut.ValidateAsync(document, CancellationToken.None);

        response.Valid.Should().BeTrue();
        response.Issues.Should().ContainSingle(issue =>
            issue.Kind == PolicyPackContentValidationIssueKind.Warning &&
            issue.Message.Contains("unknown-custom-rule", StringComparison.Ordinal));
    }

    [Fact]
    public async Task ValidateAsync_when_curated_metadata_contains_rule_id_accepts_matching_key()
    {
        PolicyPackContentAuthoringValidationService sut = CreateSut([]);

        PolicyPackContentDocument document = new()
        {
            ComplianceRuleKeys = ["tenant-authored-rule"],
            Metadata =
            {
                ["pack.curatedRules.v1"] =
                    """
                    {
                      "schemaVersion": 1,
                      "kind": "archlucid.policyPack.curatedRules.v1",
                      "rules": [{ "id": "tenant-authored-rule", "title": "Tenant rule" }]
                    }
                    """,
            },
        };

        PolicyPackContentValidationResponse response = await sut.ValidateAsync(document, CancellationToken.None);

        response.Valid.Should().BeTrue();
        response.Issues.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateAsync_when_empty_guid_in_compliance_rule_ids_returns_error()
    {
        PolicyPackContentAuthoringValidationService sut = CreateSut([]);

        PolicyPackContentDocument document = new()
        {
            ComplianceRuleIds = [Guid.Empty],
        };

        PolicyPackContentValidationResponse response = await sut.ValidateAsync(document, CancellationToken.None);

        response.Valid.Should().BeFalse();
        response.Issues.Should().Contain(issue => issue.Kind == PolicyPackContentValidationIssueKind.Error);
    }

    private static PolicyPackContentAuthoringValidationService CreateSut(IReadOnlyList<string> knownRuleIds)
    {
        ComplianceRulePack pack = new()
        {
            RulePackId = "test-pack",
            Name = "Test",
            Version = "1.0.0",
            RulePackHash = "hash",
            SourcePath = "test",
            Rules = knownRuleIds
                .Select(id => new ComplianceRule { RuleId = id, ControlId = id, ControlName = id })
                .ToList(),
        };

        Mock<IComplianceRulePackProvider> provider = new();
        provider
            .Setup(p => p.GetRulePackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        return new PolicyPackContentAuthoringValidationService(provider.Object);
    }
}
