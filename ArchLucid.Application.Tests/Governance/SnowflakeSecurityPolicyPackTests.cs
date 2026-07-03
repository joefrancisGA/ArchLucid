using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Application.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SnowflakeSecurityPolicyPackTests
{
    private const string CuratedRelativePath = "docs/samples/policy-packs/snowflake-security-rules-v1.json";
    private const string ContentRelativePath = "ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/snowflake-security.json";

    private static readonly HashSet<string> AllowedSeverities = new(StringComparer.Ordinal)
    {
        "Critical",
        "High",
        "Medium",
        "Low",
    };

    [Fact]
    public void Snowflake_security_curated_document_passes_validation()
    {
        JsonObject document = LoadCuratedDocument();
        CuratedRulesDocumentValidationResult result = new CuratedRulesDocumentValidationService().Validate(document);

        result.IsValid.Should().BeTrue("validation errors: {0}", string.Join("; ", result.Errors));
    }

    [Fact]
    public void Snowflake_security_has_at_least_35_unique_rules_with_required_fields()
    {
        JsonObject document = LoadCuratedDocument();
        JsonArray rules = document["rules"]!.AsArray();

        rules.Count.Should().BeGreaterOrEqualTo(35);

        HashSet<string> ids = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonNode? node in rules)
        {
            JsonObject rule = node!.AsObject();
            string id = rule["id"]!.GetValue<string>();
            ids.Add(id).Should().BeTrue("duplicate rule id {0}", id);

            rule["title"]!.GetValue<string>().Trim().Should().NotBeNullOrWhiteSpace();
            rule["description"]!.GetValue<string>().Trim().Length.Should().BeGreaterThan(24);
            rule["remediationGuidance"]!.GetValue<string>().Trim().Should().NotBeNullOrWhiteSpace();

            string severity = rule["severity"]!.GetValue<string>();
            AllowedSeverities.Should().Contain(severity);

            JsonArray hints = rule["evidenceHints"]!.AsArray();
            hints.Count.Should().BeGreaterThan(0);

            hints.Should().Contain(h => h!.GetValue<string>().StartsWith("snowflake.", StringComparison.Ordinal));
        }
    }

    [Fact]
    public void Snowflake_security_content_document_aligns_with_curated_rules()
    {
        string repoRoot = RequireRepoRoot();
        PolicyPackContentDocument content = LoadContentDocument(repoRoot);

        content.ComplianceRuleKeys.Should().NotBeNullOrEmpty();
        content.Metadata.Should().ContainKey("curatedRulesArtifact");
        content.Metadata!["curatedRulesArtifact"].Should().Be(CuratedRelativePath);

        JsonObject curated = LoadCuratedDocument();
        HashSet<string> curatedIds = curated["rules"]!
            .AsArray()
            .Select(node => node!["id"]!.GetValue<string>())
            .ToHashSet(StringComparer.Ordinal);

        content.ComplianceRuleKeys!.ToHashSet(StringComparer.Ordinal).Should().BeEquivalentTo(curatedIds);

        DefaultPolicyPackCoverageTestSupport.AssertCuratedArtifactAligns(
            repoRoot,
            content,
            "Snowflake Security");
    }

    [Fact]
    public void Snowflake_security_includes_required_minimum_rule_ids()
    {
        JsonObject document = LoadCuratedDocument();
        HashSet<string> ids = document["rules"]!
            .AsArray()
            .Select(node => node!["id"]!.GetValue<string>())
            .ToHashSet(StringComparer.Ordinal);

        string[] required =
        [
            "sf-id-001",
            "sf-rbac-004",
            "sf-prot-001",
            "sf-stage-001",
            "sf-log-003",
            "sf-share-002",
            "sf-sdlc-001",
            "sf-comp-001",
        ];

        ids.Should().Contain(required);
    }

    [Fact]
    public void Snowflake_security_descriptions_support_insufficient_evidence_language()
    {
        JsonObject document = LoadCuratedDocument();
        int withGuidanceLanguage = 0;

        foreach (JsonNode? node in document["rules"]!.AsArray())
        {
            string description = node!["description"]!.GetValue<string>();

            if (description.Contains("Insufficient evidence", StringComparison.OrdinalIgnoreCase)
                || description.Contains("Not applicable", StringComparison.OrdinalIgnoreCase))
            {
                withGuidanceLanguage++;
            }
        }

        withGuidanceLanguage.Should().BeGreaterOrEqualTo(30);
    }

    private static string RequireRepoRoot()
    {
        string? repoRoot = DefaultPolicyPackCoverageTestSupport.TryFindRepoRoot();

        repoRoot.Should().NotBeNull("repo root not found from test output directory");

        return repoRoot!;
    }

    private static PolicyPackContentDocument LoadContentDocument(string repoRoot)
    {
        string path = Path.Combine(repoRoot, ContentRelativePath.Replace('/', Path.DirectorySeparatorChar));
        string json = File.ReadAllText(path);

        return JsonSerializer.Deserialize<PolicyPackContentDocument>(json)
            ?? throw new InvalidOperationException("Invalid Snowflake Security content document JSON.");
    }

    private static JsonObject LoadCuratedDocument()
    {
        string repoRoot = RequireRepoRoot();
        string path = Path.Combine(repoRoot, CuratedRelativePath.Replace('/', Path.DirectorySeparatorChar));

        return JsonNode.Parse(File.ReadAllText(path))!.AsObject();
    }
}
