using System.Text.Json.Nodes;

using ArchLucid.Application.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CuratedRulesDocumentValidationServiceTests
{
    private readonly CuratedRulesDocumentValidationService _sut = new();

    [Fact]
    public void Validate_passes_for_well_formed_document()
    {
        JsonObject document = ValidDocument();

        CuratedRulesDocumentValidationResult result = _sut.Validate(document);

        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
        result.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Validate_reports_duplicate_rule_ids_as_error()
    {
        JsonObject document = ValidDocument();
        JsonArray rules = document["rules"]!.AsArray();
        rules.Add(rules[0]!.DeepClone());

        CuratedRulesDocumentValidationResult result = _sut.Validate(document);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("Duplicate rule id", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_reports_invalid_severity_as_error()
    {
        JsonObject document = ValidDocument();
        document["rules"]![0]!["severity"] = "Urgent";

        CuratedRulesDocumentValidationResult result = _sut.Validate(document);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("invalid severity", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_reports_thin_descriptions_as_warnings()
    {
        JsonObject document = ValidDocument();
        document["rules"]![0]!["title"] = "Short";
        document["rules"]![0]!["description"] = "Too brief";

        CuratedRulesDocumentValidationResult result = _sut.Validate(document);

        result.IsValid.Should().BeTrue();
        result.Warnings.Should().NotBeEmpty();
    }

    [Fact]
    public void Validate_reports_empty_rules_as_error()
    {
        JsonObject document = ValidDocument();
        document["rules"] = new JsonArray();

        CuratedRulesDocumentValidationResult result = _sut.Validate(document);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("At least one rule", StringComparison.Ordinal));
    }

    private static JsonObject ValidDocument()
    {
        return JsonNode.Parse(
                   """
                   {
                     "schemaVersion": 1,
                     "kind": "archlucid.policyPack.curatedRules.v1",
                     "pack": {
                       "name": "Encryption pack",
                       "description": "Encrypt data at rest"
                     },
                     "rules": [
                       {
                         "id": "encrypt-data-001",
                         "title": "Encrypt data at rest",
                         "description": "All databases must use encryption at rest with customer-managed keys.",
                         "severity": "Critical",
                         "remediationGuidance": "Enable CMK encryption on each datastore.",
                         "evidenceHints": ["datastores[].EncryptionAtRest"],
                         "frameworkMappings": [{ "framework": "SOC2", "requirement": "CC6.1" }]
                       }
                     ]
                   }
                   """)!
               .AsObject();
    }
}
