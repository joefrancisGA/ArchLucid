using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks.CuratedRules;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC26 coverage batch for deterministic <c>ArchLucid.Core</c> helpers that carried no direct tests:
///     curated policy-pack rule mapping, the Ask starter-prompt catalog, project-role rank parsing,
///     golden-cohort category aggregation, Azure ARM cost-platform inference, deployment-status options,
///     keyset pagination cursor codecs, and the tenant catalog migration record.
/// </summary>
public sealed class CorePackageCoverageBatchRc26Tests
{
    [Fact]
    public void TryMapToComplianceRule_NullEntry_Throws()
    {
        Action act = () => CuratedComplianceRuleMapper.TryMapToComplianceRule(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("entry");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryMapToComplianceRule_BlankId_ReturnsNull(string? id)
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = id,
        };

        CuratedComplianceRuleMapper.TryMapToComplianceRule(entry).Should().BeNull();
    }

    [Fact]
    public void TryMapToComplianceRule_MinimalEntry_AppliesDefaultsAndTrimsId()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "  tenant-rule-1  ",
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.RuleId.Should().Be("tenant-rule-1");
        rule.ControlId.Should().Be("tenant-rule-1");

        // Title is absent, so the mapper falls back to the trimmed rule id.
        rule.ControlName.Should().Be("tenant-rule-1");
        rule.AppliesToCategory.Should().Be(CuratedComplianceRuleMapper.TenantCuratedCategory);
        rule.RequiredNodeType.Should().BeEmpty();
        rule.RequiredEdgeType.Should().BeEmpty();
        rule.Severity.Should().Be("Medium");
        rule.Priority.Should().Be(PolicyPackRulePriority.Default);
        rule.Description.Should().BeEmpty();
    }

    [Fact]
    public void TryMapToComplianceRule_TitleAndSeverityProvided_AreTrimmed()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-2",
            Title = "  Encrypt data at rest  ",
            Severity = "  High  ",
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.ControlName.Should().Be("Encrypt data at rest");
        rule.Severity.Should().Be("High");
    }

    [Theory]
    [InlineData("P0", PolicyPackRulePriority.P0)]
    [InlineData("  p0  ", PolicyPackRulePriority.P0)]
    [InlineData("0", PolicyPackRulePriority.P0)]
    [InlineData("P2", PolicyPackRulePriority.P2)]
    [InlineData("2", PolicyPackRulePriority.P2)]
    [InlineData("P1", PolicyPackRulePriority.P1)]
    [InlineData("not-a-tier", PolicyPackRulePriority.P1)]
    public void TryMapToComplianceRule_ExplicitPriority_IsNormalizedToTier(string priority, string expected)
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-3",
            Priority = priority,
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Priority.Should().Be(expected);
    }

    [Fact]
    public void TryMapToComplianceRule_EmptyCollections_OmitDescriptionSections()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-4",
            Description = "Base only.",
            EvidenceHints = [],
            FrameworkMappings = [],
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Description.Should().Be("Base only.");
    }

    [Fact]
    public void TryMapToComplianceRule_AllHintsAndMappingsBlank_EmitsHeadersWithoutItems()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-5",
            EvidenceHints = ["", "   "],
            FrameworkMappings =
            [
                null!,
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "   ",
                },
            ],
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();

        // Headers are emitted from the non-empty list check; every item is then filtered out.
        rule!.Description.Should().Be("\n\nEvidence hints:\n\nFramework mappings:");
    }

    [Fact]
    public void TryMapToComplianceRule_FullEntry_ComposesDescriptionSections()
    {
        CuratedRulesRuleEntry entry = new()
        {
            Id = "tenant-rule-6",
            Title = "Rotate keys",
            Description = "  Keys must rotate every 90 days.  ",
            RemediationGuidance = "  Enable automatic rotation.  ",
            EvidenceHints = ["  Key Vault rotation policy  ", "", "Audit log export"],
            FrameworkMappings =
            [
                null!,
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "  ",
                    Control = "ignored",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "  SOC 2  ",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "ISO 27001",
                    Control = "  A.10.1  ",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "PCI DSS",
                    Requirement = "  3.6.4  ",
                },
                new CuratedRulesFrameworkMappingEntry
                {
                    Framework = "NIST 800-53",
                    Control = "SC-12",
                    Requirement = "Key management",
                },
            ],
        };

        ComplianceRule? rule = CuratedComplianceRuleMapper.TryMapToComplianceRule(entry);

        rule.Should().NotBeNull();
        rule!.Description.Should().Be(
            "Keys must rotate every 90 days."
            + "\n\nRemediation: Enable automatic rotation."
            + "\n\nEvidence hints:"
            + "\n- Key Vault rotation policy"
            + "\n- Audit log export"
            + "\n\nFramework mappings:"
            + "\n- SOC 2"
            + "\n- ISO 27001 — control: A.10.1"
            + "\n- PCI DSS — requirement: 3.6.4"
            + "\n- NIST 800-53 — control: SC-12 — requirement: Key management");
    }

    [Fact]
    public void CuratedPolicyPackRulesDocument_DeserializesPackAndRuleProperties()
    {
        const string json = """
            {
              "schemaVersion": 3,
              "kind": "curated-policy-pack-rules",
              "pack": {
                "name": "Curated Baseline",
                "description": "Baseline security controls",
                "version": "2.1.0",
                "category": "Security",
                "isDefault": true,
                "suggestedPackType": "Compliance",
                "policyPackContentDocumentPath": "packs/baseline.content.json"
              },
              "rules": [
                {
                  "id": "curated-1",
                  "title": "Private endpoints only",
                  "description": "Public network access must be disabled.",
                  "severity": "High",
                  "priority": "P0",
                  "remediationGuidance": "Disable public network access.",
                  "evidenceHints": ["Network rule set", "Firewall config"],
                  "frameworkMappings": [
                    {
                      "framework": "SOC 2",
                      "control": "CC6.6",
                      "requirement": "Restrict network access"
                    }
                  ]
                }
              ]
            }
            """;

        CuratedPolicyPackRulesDocument? document =
            JsonSerializer.Deserialize<CuratedPolicyPackRulesDocument>(json);

        document.Should().NotBeNull();
        document!.SchemaVersion.Should().Be(3);
        document.Kind.Should().Be("curated-policy-pack-rules");

        document.Pack.Should().NotBeNull();
        document.Pack!.Name.Should().Be("Curated Baseline");
        document.Pack.Description.Should().Be("Baseline security controls");
        document.Pack.Version.Should().Be("2.1.0");
        document.Pack.Category.Should().Be("Security");
        document.Pack.IsDefault.Should().BeTrue();
        document.Pack.SuggestedPackType.Should().Be("Compliance");
        document.Pack.PolicyPackContentDocumentPath.Should().Be("packs/baseline.content.json");

        document.Rules.Should().HaveCount(1);

        CuratedRulesRuleEntry ruleEntry = document.Rules![0];
        ruleEntry.Id.Should().Be("curated-1");
        ruleEntry.Title.Should().Be("Private endpoints only");
        ruleEntry.Description.Should().Be("Public network access must be disabled.");
        ruleEntry.Severity.Should().Be("High");
        ruleEntry.Priority.Should().Be("P0");
        ruleEntry.RemediationGuidance.Should().Be("Disable public network access.");
        ruleEntry.EvidenceHints.Should().Equal("Network rule set", "Firewall config");

        ruleEntry.FrameworkMappings.Should().HaveCount(1);
        ruleEntry.FrameworkMappings![0].Framework.Should().Be("SOC 2");
        ruleEntry.FrameworkMappings[0].Control.Should().Be("CC6.6");
        ruleEntry.FrameworkMappings[0].Requirement.Should().Be("Restrict network access");
    }

    [Fact]
    public void CuratedPolicyPackRulesDocument_AbsentSections_StayNull()
    {
        const string json = """{ "schemaVersion": 1 }""";

        CuratedPolicyPackRulesDocument? document =
            JsonSerializer.Deserialize<CuratedPolicyPackRulesDocument>(json);

        document.Should().NotBeNull();
        document!.SchemaVersion.Should().Be(1);
        document.Kind.Should().BeNull();
        document.Pack.Should().BeNull();
        document.Rules.Should().BeNull();
    }

    [Fact]
    public void AskPromptTemplateCatalog_ReturnsPopulatedDistinctStarterPrompts()
    {
        IReadOnlyList<AskPromptTemplate> templates = AskPromptTemplateCatalog.GetTemplates();

        templates.Should().HaveCount(5);
        templates.Select(template => template.Id).Should().OnlyHaveUniqueItems();
        templates.Select(template => template.Id).Should().Contain(
        [
            "security-boundaries",
            "single-points-of-failure",
            "cost-hotspots",
            "compliance-gaps",
            "prior-decisions",
        ]);

        templates.Should().AllSatisfy(template =>
        {
            template.Id.Should().NotBeNullOrWhiteSpace();
            template.Title.Should().NotBeNullOrWhiteSpace();
            template.Prompt.Should().NotBeNullOrWhiteSpace();
        });
    }

    [Fact]
    public void AskPromptTemplate_Defaults_AreEmptyStrings()
    {
        AskPromptTemplate template = new();

        template.Id.Should().BeEmpty();
        template.Title.Should().BeEmpty();
        template.Prompt.Should().BeEmpty();
    }

    [Fact]
    public void ProjectRoleAssignmentRole_Constants_MatchPersistedLiterals()
    {
        ProjectRoleAssignmentRole.Reader.Should().Be("Reader");
        ProjectRoleAssignmentRole.Operator.Should().Be("Operator");
        ProjectRoleAssignmentRole.ProjectAdmin.Should().Be("ProjectAdmin");
    }

    [Theory]
    [InlineData(null, ProjectScopedEffectiveRole.None)]
    [InlineData("", ProjectScopedEffectiveRole.None)]
    [InlineData("   ", ProjectScopedEffectiveRole.None)]
    [InlineData("ProjectAdmin", ProjectScopedEffectiveRole.ProjectAdmin)]
    [InlineData("  projectadmin  ", ProjectScopedEffectiveRole.ProjectAdmin)]
    [InlineData("Operator", ProjectScopedEffectiveRole.Operator)]
    [InlineData("  OPERATOR ", ProjectScopedEffectiveRole.Operator)]
    [InlineData("Reader", ProjectScopedEffectiveRole.Reader)]
    [InlineData(" reader ", ProjectScopedEffectiveRole.Reader)]
    [InlineData("TenantAdmin", ProjectScopedEffectiveRole.None)]
    public void ProjectRoleAssignmentRole_ParseRank_MapsSqlLiteralToRank(
        string? sqlRole,
        ProjectScopedEffectiveRole expected)
    {
        ProjectRoleAssignmentRole.ParseRank(sqlRole!).Should().Be(expected);
    }

    [Fact]
    public void DistinctCategories_NullResults_Throws()
    {
        Action act = () => GoldenCohortFindingCategoryAggregator.DistinctCategories(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("results");
    }

    [Fact]
    public void DistinctCategories_EmptyResults_ReturnsEmptySet()
    {
        GoldenCohortFindingCategoryAggregator.DistinctCategories([]).Should().BeEmpty();
    }

    [Fact]
    public void DistinctCategories_TrimsDeduplicatesAndSortsOrdinal()
    {
        AgentResult first = new()
        {
            Findings =
            [
                new ArchitectureFinding
                {
                    Category = "  Security  ",
                },
                new ArchitectureFinding
                {
                    Category = "Cost",
                },
                new ArchitectureFinding
                {
                    Category = "   ",
                },
            ],
        };

        AgentResult second = new()
        {
            Findings =
            [
                new ArchitectureFinding
                {
                    Category = "Security",
                },
                new ArchitectureFinding
                {
                    Category = "Reliability",
                },

                // Ordinal comparison keeps this distinct from "Security".
                new ArchitectureFinding
                {
                    Category = "security",
                },
            ],
        };

        SortedSet<string> categories =
            GoldenCohortFindingCategoryAggregator.DistinctCategories([first, second]);

        categories.Should().Equal("Cost", "Reliability", "Security", "security");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Microsoft.Network/virtualNetworks")]
    [InlineData("microsoft.insights/components")]
    public void TryInferPlatform_UnrecognizedOrBlankType_ReturnsNull(string? armResourceType)
    {
        AzureArmResourceCostMapper.TryInferPlatform(armResourceType).Should().BeNull();
    }

    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", RuntimePlatform.Vm)]
    [InlineData("  microsoft.compute/virtualmachines  ", RuntimePlatform.Vm)]
    [InlineData("Microsoft.Web/sites", RuntimePlatform.AppService)]
    [InlineData("Microsoft.Web/serverFarms", RuntimePlatform.AppService)]
    [InlineData("Microsoft.ContainerService/managedClusters", RuntimePlatform.Aks)]
    [InlineData("Microsoft.Sql/servers/databases", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Sql/servers/databases/extra-segment", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Sql/managedInstances", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Storage/storageAccounts", RuntimePlatform.BlobStorage)]
    [InlineData("Microsoft.Cache/redis", RuntimePlatform.Redis)]
    [InlineData("Microsoft.KeyVault/vaults", RuntimePlatform.KeyVault)]
    [InlineData("Microsoft.Search/searchServices", RuntimePlatform.AzureAiSearch)]
    [InlineData("Microsoft.CognitiveServices/accounts", RuntimePlatform.AzureOpenAi)]
    public void TryInferPlatform_RecognizedType_ReturnsCostingPlatform(
        string armResourceType,
        RuntimePlatform expected)
    {
        AzureArmResourceCostMapper.TryInferPlatform(armResourceType).Should().Be(expected);
    }

    [Fact]
    public void DeploymentStatusOptions_Defaults_AreUnset()
    {
        DeploymentStatusOptions options = new();

        DeploymentStatusOptions.SectionPath.Should().Be("DeploymentStatus");
        options.GitHubCommitUrlTemplate.Should().BeNull();
        options.GitHubWorkflowRunUrlTemplate.Should().BeNull();
        options.LatestGitHubWorkflowRunId.Should().BeNull();
        options.AzureResourceOverviewUrl.Should().BeNull();
        options.LogsUrl.Should().BeNull();
        options.MonitoringUrl.Should().BeNull();
        options.WorkerBuildCommitSha.Should().BeNull();
        options.LastKnownGoodBuildId.Should().BeNull();
        options.LatestSmokeTestResult.Should().BeNull();
    }

    [Fact]
    public void DeploymentStatusOptions_RoundTripsEveryLinkAndIdentityOverride()
    {
        DeploymentStatusOptions options = new()
        {
            GitHubCommitUrlTemplate = "https://github.com/org/repo/commit/{commitSha}",
            GitHubWorkflowRunUrlTemplate = "https://github.com/org/repo/actions/runs/{runId}",
            LatestGitHubWorkflowRunId = "998877",
            AzureResourceOverviewUrl = "https://portal.azure.com/#resource/overview",
            LogsUrl = "https://portal.azure.com/#logs",
            MonitoringUrl = "https://portal.azure.com/#monitoring",
            WorkerBuildCommitSha = "abc1234",
            LastKnownGoodBuildId = "build-42",
            LatestSmokeTestResult = "Passed",
        };

        options.GitHubCommitUrlTemplate.Should().Be("https://github.com/org/repo/commit/{commitSha}");
        options.GitHubWorkflowRunUrlTemplate.Should().Be("https://github.com/org/repo/actions/runs/{runId}");
        options.LatestGitHubWorkflowRunId.Should().Be("998877");
        options.AzureResourceOverviewUrl.Should().Be("https://portal.azure.com/#resource/overview");
        options.LogsUrl.Should().Be("https://portal.azure.com/#logs");
        options.MonitoringUrl.Should().Be("https://portal.azure.com/#monitoring");
        options.WorkerBuildCommitSha.Should().Be("abc1234");
        options.LastKnownGoodBuildId.Should().Be("build-42");
        options.LatestSmokeTestResult.Should().Be("Passed");
    }

    /// <summary>
    ///     Builds a cursor from raw JSON so decode-side guard branches (missing keys, unparseable timestamps,
    ///     empty identifiers) can be exercised without a matching <c>Encode</c> overload.
    /// </summary>
    private static string EncodeJsonCursor(string json)
    {
        string base64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));

        return base64.TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    // Varying the integer width shifts the payload length through every Base64 padding residue.
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(123)]
    [InlineData(-4096)]
    public void ArtifactCursorCodec_RoundTripsSortOrderAndArtifactId(int sortOrder)
    {
        Guid artifactId = Guid.NewGuid();

        string encoded = ArtifactCursorCodec.Encode(sortOrder, artifactId);

        encoded.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        ArtifactCursorCodec.TryDecode(encoded).Should().Be((sortOrder, artifactId));
    }

    [Fact]
    public void ArtifactCursorCodec_TryDecode_TrimsSurroundingWhitespace()
    {
        Guid artifactId = Guid.NewGuid();

        string encoded = ArtifactCursorCodec.Encode(7, artifactId);

        ArtifactCursorCodec.TryDecode($"  {encoded}  ").Should().Be((7, artifactId));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ArtifactCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        ArtifactCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void ArtifactCursorCodec_TryDecode_EmptyArtifactId_ReturnsNull()
    {
        ArtifactCursorCodec.TryDecode(ArtifactCursorCodec.Encode(3, Guid.Empty)).Should().BeNull();
    }

    [Fact]
    public void ArtifactCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        ArtifactCursorCodec.TryDecode(EncodeJsonCursor("null")).Should().BeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(123)]
    [InlineData(-77)]
    public void FindingCursorCodec_RoundTripsSortOrderAndFindingRecordId(int sortOrder)
    {
        Guid findingRecordId = Guid.NewGuid();

        string encoded = FindingCursorCodec.Encode(sortOrder, findingRecordId);

        encoded.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        FindingCursorCodec.TryDecode(encoded).Should().Be((sortOrder, findingRecordId));
    }

    [Fact]
    public void FindingCursorCodec_TryDecode_TrimsSurroundingWhitespace()
    {
        Guid findingRecordId = Guid.NewGuid();

        string encoded = FindingCursorCodec.Encode(11, findingRecordId);

        FindingCursorCodec.TryDecode($"\t{encoded}\n").Should().Be((11, findingRecordId));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void FindingCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        FindingCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void FindingCursorCodec_TryDecode_EmptyFindingRecordId_ReturnsNull()
    {
        FindingCursorCodec.TryDecode(FindingCursorCodec.Encode(3, Guid.Empty)).Should().BeNull();
    }

    [Fact]
    public void FindingCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        FindingCursorCodec.TryDecode(EncodeJsonCursor("null")).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_RoundTripsCreatedUtcAndRunId()
    {
        DateTime createdUtc = new(2026, 8, 8, 17, 4, 33, 512, DateTimeKind.Utc);
        Guid runId = Guid.NewGuid();

        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(
            RunCursorCodec.Encode(createdUtc, runId));

        decoded.Should().NotBeNull();
        decoded!.Value.CreatedUtc.Should().Be(createdUtc);
        decoded.Value.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.RunId.Should().Be(runId);
    }

    [Fact]
    public void RunCursorCodec_Encode_TreatsUnspecifiedKindAsUtc()
    {
        DateTime unspecified = new(2026, 1, 2, 3, 4, 5, DateTimeKind.Unspecified);
        Guid runId = Guid.NewGuid();

        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(
            RunCursorCodec.Encode(unspecified, runId));

        decoded.Should().NotBeNull();
        decoded!.Value.CreatedUtc.Should().Be(DateTime.SpecifyKind(unspecified, DateTimeKind.Utc));
        decoded.Value.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void RunCursorCodec_TryDecode_OffsetTimestamp_IsNormalizedToUtc()
    {
        Guid runId = Guid.NewGuid();
        string cursor = EncodeJsonCursor(
            $"{{\"cu\":\"2026-08-08T12:00:00.0000000+02:00\",\"ri\":\"{runId}\"}}");

        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor);

        decoded.Should().NotBeNull();
        decoded!.Value.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.CreatedUtc.Should().Be(new DateTime(2026, 8, 8, 10, 0, 0, DateTimeKind.Utc));
        decoded.Value.RunId.Should().Be(runId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RunCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        RunCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_MalformedBase64_ReturnsNull()
    {
        RunCursorCodec.TryDecode("not-a-valid-cursor!!").Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        RunCursorCodec.TryDecode(EncodeJsonCursor("null")).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_MissingTimestamp_ReturnsNull()
    {
        RunCursorCodec.TryDecode(EncodeJsonCursor($"{{\"cu\":\"\",\"ri\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_EmptyRunId_ReturnsNull()
    {
        RunCursorCodec.TryDecode(RunCursorCodec.Encode(DateTime.UtcNow, Guid.Empty)).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_UnparseableTimestamp_ReturnsNull()
    {
        RunCursorCodec.TryDecode(
                EncodeJsonCursor($"{{\"cu\":\"never\",\"ri\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_RoundTripsOccurredUtcAndEventId()
    {
        DateTime occurredUtc = new(2026, 3, 14, 15, 9, 26, 535, DateTimeKind.Utc);
        Guid eventId = Guid.NewGuid();

        (DateTime OccurredUtc, Guid EventId)? decoded = AuditEventCursorCodec.TryDecode(
            AuditEventCursorCodec.Encode(occurredUtc, eventId));

        decoded.Should().NotBeNull();
        decoded!.Value.OccurredUtc.Should().Be(occurredUtc);
        decoded.Value.OccurredUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.EventId.Should().Be(eventId);
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_OffsetTimestamp_IsNormalizedToUtc()
    {
        Guid eventId = Guid.NewGuid();
        string cursor = EncodeJsonCursor(
            $"{{\"ou\":\"2026-08-08T23:30:00.0000000-04:00\",\"ei\":\"{eventId}\"}}");

        (DateTime OccurredUtc, Guid EventId)? decoded = AuditEventCursorCodec.TryDecode(cursor);

        decoded.Should().NotBeNull();
        decoded!.Value.OccurredUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.OccurredUtc.Should().Be(new DateTime(2026, 8, 9, 3, 30, 0, DateTimeKind.Utc));
        decoded.Value.EventId.Should().Be(eventId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AuditEventCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        AuditEventCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_MalformedBase64_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode("$$$not-base64$$$").Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(EncodeJsonCursor("null")).Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_MissingTimestamp_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(EncodeJsonCursor($"{{\"ou\":\"\",\"ei\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_EmptyEventId_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(AuditEventCursorCodec.Encode(DateTime.UtcNow, Guid.Empty))
            .Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_UnparseableTimestamp_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(
                EncodeJsonCursor($"{{\"ou\":\"whenever\",\"ei\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }

    [Fact]
    public void TenantCatalogMigrationRecord_InFlightMigration_IsActive()
    {
        Guid migrationId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset startedUtc = new(2026, 8, 8, 12, 0, 0, TimeSpan.Zero);

        TenantCatalogMigrationRecord record = new()
        {
            MigrationId = migrationId,
            TenantId = tenantId,
            CorrelationId = "corr-1",
            Stage = TenantCatalogMigrationStage.ProjectionRefresh,
            StartedUtc = startedUtc,
            MaintenanceMessage = "Migration in progress",
        };

        record.MigrationId.Should().Be(migrationId);
        record.TenantId.Should().Be(tenantId);
        record.CorrelationId.Should().Be("corr-1");
        record.Stage.Should().Be(TenantCatalogMigrationStage.ProjectionRefresh);
        record.StartedUtc.Should().Be(startedUtc);
        record.CompletedUtc.Should().BeNull();
        record.MaintenanceMessage.Should().Be("Migration in progress");
        record.VerificationPassedUtc.Should().BeNull();
        record.LastVerificationError.Should().BeNull();
        record.IsActive.Should().BeTrue();
    }

    [Fact]
    public void TenantCatalogMigrationRecord_CompletedMigration_IsNotActive()
    {
        DateTimeOffset completedUtc = new(2026, 8, 8, 13, 30, 0, TimeSpan.Zero);
        DateTimeOffset verifiedUtc = new(2026, 8, 8, 13, 25, 0, TimeSpan.Zero);

        TenantCatalogMigrationRecord record = new()
        {
            Stage = TenantCatalogMigrationStage.Complete,
            CompletedUtc = completedUtc,
            VerificationPassedUtc = verifiedUtc,
            LastVerificationError = "row count drifted on first attempt",
        };

        record.Stage.Should().Be(TenantCatalogMigrationStage.Complete);
        record.CompletedUtc.Should().Be(completedUtc);
        record.VerificationPassedUtc.Should().Be(verifiedUtc);
        record.LastVerificationError.Should().Be("row count drifted on first attempt");
        record.CorrelationId.Should().BeEmpty();
        record.MaintenanceMessage.Should().BeEmpty();
        record.IsActive.Should().BeFalse();
    }
}
