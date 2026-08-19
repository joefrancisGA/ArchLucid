using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackGeneratorServiceTests
{
    [Fact]
    public async Task GenerateAsync_returns_curated_document_json_with_disclaimer()
    {
        const string generated = """
                                 {
                                   "schemaVersion": 1,
                                   "kind": "archlucid.policyPack.curatedRules.v1",
                                   "pack": { "name": "Encryption pack", "description": "Encrypt data" },
                                   "rules": [
                                     {
                                       "id": "encrypt-data-001",
                                       "title": "Encrypt data at rest",
                                       "description": "All databases must use encryption.",
                                       "severity": "Critical",
                                       "remediationGuidance": "Enable CMK encryption.",
                                       "evidenceHints": ["datastores[].EncryptionAtRest"],
                                       "frameworkMappings": [{ "framework": "SOC2", "requirement": "CC6.1" }]
                                     }
                                   ]
                                 }
                                 """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(generated);

        PolicyPackGeneratorService sut = new(client.Object, new CuratedRulesDocumentValidationService());

        GeneratePolicyPackResponse response = await sut.GenerateAsync(
            new GeneratePolicyPackRequest { Prompt = "Ensure all databases are encrypted at rest with customer-managed keys." },
            CancellationToken.None);

        response.Disclaimer.Should().Be(DraftPolicyPackRuleResponse.DefaultDisclaimer);
        response.CuratedRulesDocumentJson.Should().Contain("encrypt-data-001");
        response.CuratedRulesDocumentJson.Should().Contain("archlucid.policyPack.curatedRules.v1");
        response.RequiresHumanReview.Should().BeTrue();
        response.ValidationWarnings.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateAsync_throws_when_duplicate_rule_ids_present()
    {
        const string generated = """
                                 {
                                   "schemaVersion": 1,
                                   "kind": "archlucid.policyPack.curatedRules.v1",
                                   "pack": { "name": "Encryption pack", "description": "Encrypt data" },
                                   "rules": [
                                     {
                                       "id": "encrypt-data-001",
                                       "title": "Encrypt data at rest",
                                       "description": "All databases must use encryption.",
                                       "severity": "Critical"
                                     },
                                     {
                                       "id": "encrypt-data-001",
                                       "title": "Duplicate rule",
                                       "description": "Duplicate id should fail validation.",
                                       "severity": "High"
                                     }
                                   ]
                                 }
                                 """;

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(generated);

        PolicyPackGeneratorService sut = new(client.Object, new CuratedRulesDocumentValidationService());

        Func<Task> act = () => sut.GenerateAsync(
            new GeneratePolicyPackRequest { Prompt = "Ensure all databases are encrypted at rest with customer-managed keys." },
            CancellationToken.None);

        await act.Should().ThrowAsync<CuratedRulesDocumentValidationException>()
            .Where(ex => ex.Errors.Any(error => error.Contains("Duplicate rule id", StringComparison.Ordinal)));
    }
}
