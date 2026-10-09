using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewCacheManifestBuilderTests
{
    [Fact]
    public void Build_changes_content_hash_when_source_text_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Public API without auth.");
        ClosedLoopReasoningRequest changed = CreateRequest("Public API without auth. Added billing worker.");

        ReviewCacheDependencyManifest hashA = ReviewCacheManifestBuilder.Build(baseline);
        ReviewCacheDependencyManifest hashB = ReviewCacheManifestBuilder.Build(changed);

        hashA.ContentHash.Should().NotBe(hashB.ContentHash);
        hashA.PromptVersion.Should().Be(hashB.PromptVersion);
    }

    [Fact]
    public void Build_matches_content_hash_when_baseline_model_changes_and_client_run_id_is_blank()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = null;

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-generated",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-generated",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, baseline).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, changed).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_model_fingerprint_changes_for_supplied_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-with-model";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-with-model",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-with-model",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.Build(request, baseline).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, changed).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_declared_priorities_change()
    {
        ClosedLoopReasoningRequest security = CreateRequest("Architecture note.");
        security.DeclaredPriorities = ["Security"];

        ClosedLoopReasoningRequest cost = CreateRequest("Architecture note.");
        cost.DeclaredPriorities = ["Cost"];

        ReviewCacheManifestBuilder.Build(security).DeclaredPrioritiesHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(cost).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_client_run_id_is_whitespace_only_vs_omitted()
    {
        ClosedLoopReasoningRequest omitted = CreateRequest("Architecture note.");

        ClosedLoopReasoningRequest whitespace = CreateRequest("Architecture note.");
        whitespace.RunId = "   ";

        ReviewCacheManifestBuilder.Build(omitted).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(whitespace).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_model_loads_for_same_client_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-first-persist";

        ArchitectureKnowledgeModel persisted = new()
        {
            ModelId = "model-1",
            RunId = "run-first-persist",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request, baselineKnowledgeModel: null).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, persisted).ContentHash);
    }

    [Fact]
    public void Build_matches_declared_priorities_hash_when_entries_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest mixedCase = CreateRequest("Architecture note.");
        mixedCase.DeclaredPriorities = ["Security", "security"];

        ClosedLoopReasoningRequest canonical = CreateRequest("Architecture note.");
        canonical.DeclaredPriorities = ["Security"];

        ReviewCacheManifestBuilder.Build(mixedCase).DeclaredPrioritiesHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(canonical).DeclaredPrioritiesHash);
    }

    [Fact]
    public void Build_ignores_publish_intent_for_content_hash()
    {
        ClosedLoopReasoningRequest withoutPublish = CreateRequest("Architecture note.");
        withoutPublish.PublishToProduct = false;

        ClosedLoopReasoningRequest withPublish = CreateRequest("Architecture note.");
        withPublish.PublishToProduct = true;

        ReviewCacheManifestBuilder.Build(withoutPublish).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withPublish).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_model_alias_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Architecture note.");
        baseline.ModelAliasId = "alias-a";

        ClosedLoopReasoningRequest changed = CreateRequest("Architecture note.");
        changed.ModelAliasId = "alias-b";

        ReviewCacheManifestBuilder.Build(baseline).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(changed).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_model_alias_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest withoutAlias = CreateRequest("Architecture note.");

        ClosedLoopReasoningRequest emptyAlias = CreateRequest("Architecture note.");
        emptyAlias.ModelAliasId = string.Empty;

        ReviewCacheManifestBuilder.Build(withoutAlias).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyAlias).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_duplicate_filename_has_different_content()
    {
        ClosedLoopReasoningRequest firstBody = CreateRequest("Architecture note.");
        firstBody.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version one.",
            },
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version two.",
            },
        ];

        ClosedLoopReasoningRequest secondBody = CreateRequest("Architecture note.");
        secondBody.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version two.",
            },
            new ClosedLoopReasoningSourceText
            {
                FileName = "architecture.md",
                ContentType = "text/markdown",
                Content = "Version one.",
            },
        ];

        ReviewCacheManifestBuilder.Build(firstBody).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(secondBody).ContentHash);
    }

    [Fact]
    public void Build_changes_hash_when_golden_fixture_flag_changes()
    {
        ClosedLoopReasoningRequest withoutGolden = CreateRequest("Architecture note.");
        withoutGolden.UseGoldenFixture = false;

        ClosedLoopReasoningRequest withGolden = CreateRequest("Architecture note.");
        withGolden.UseGoldenFixture = true;

        ReviewCacheManifestBuilder.Build(withoutGolden).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(withGolden).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_review_tier_changes()
    {
        ClosedLoopReasoningRequest trial = CreateRequest("Architecture note.");
        trial.ReviewTier = ArchitectureIntelligenceReviewTier.Trial;

        ClosedLoopReasoningRequest standard = CreateRequest("Architecture note.");
        standard.ReviewTier = ArchitectureIntelligenceReviewTier.Standard;

        ReviewCacheManifestBuilder.Build(trial).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(standard).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_baseline_ledger_fingerprint_changes_for_supplied_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-with-ledger";

        TechnologyLedgerEntry awsEntry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        TechnologyLedgerEntry azureEntry = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Microsoft Azure",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };

        ReviewCacheManifestBuilder.Build(request, null, [awsEntry]).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, null, [azureEntry]).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_ledger_lock_or_evidence_changes()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-ledger-lock";

        TechnologyLedgerEntry unlocked = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            IsLocked = false,
            EvidenceRef = null,
        };

        TechnologyLedgerEntry locked = new()
        {
            RunId = request.RunId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Amazon Web Services",
            ProviderFamily = ArchLucid.Contracts.Common.CloudProvider.Aws,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            IsLocked = true,
            EvidenceRef = "evidence-1",
        };

        ReviewCacheManifestBuilder.Build(request, null, [unlocked]).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(request, null, [locked]).ContentHash);
    }

    [Fact]
    public void Build_emits_ledger_fingerprint_when_run_id_set_even_if_ledger_missing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-without-ledger";

        ReviewCacheManifestBuilder.Build(request, null, null).ContentHash
            .Should()
            .Be(        ReviewCacheManifestBuilder.Build(request, null, []).ContentHash);
    }

    [Fact]
    public void Build_emits_model_fingerprint_when_run_id_set_even_if_model_missing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-without-model";

        ReviewCacheManifestBuilder.Build(request, null).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, new ArchitectureKnowledgeModel()).ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_changes_hash_when_source_text_changes()
    {
        ClosedLoopReasoningRequest baseline = CreateRequest("Public API without auth.");
        ClosedLoopReasoningRequest changed = CreateRequest("Public API without auth. Added billing worker.");

        ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                baseline,
                "tenant-cache",
                "run-continue")
            .ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                changed,
                "tenant-cache",
                "run-continue").ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_is_null_vs_empty_string()
    {
        ClosedLoopReasoningRequest nullContent = CreateRequest("ignored");
        nullContent.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = null!,
            },
        ];

        ClosedLoopReasoningRequest emptyContent = CreateRequest("ignored");
        emptyContent.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = string.Empty,
            },
        ];

        ReviewCacheManifestBuilder.Build(nullContent).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(emptyContent).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_differs_only_by_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Same body.");
        lower.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest upper = CreateRequest("ignored");
        upper.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "TEXT/MARKDOWN",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_file_name_differs_only_by_path_separator()
    {
        ClosedLoopReasoningRequest forwardSlash = CreateRequest("Same body.");
        forwardSlash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs/arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest backslash = CreateRequest("ignored");
        backslash.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "docs\\arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(forwardSlash).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(backslash).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_source_content_type_differs_only_by_charset_parameter()
    {
        ClosedLoopReasoningRequest bare = CreateRequest("Same body.");
        bare.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown",
                Content = "Same body.",
            },
        ];

        ClosedLoopReasoningRequest withCharset = CreateRequest("ignored");
        withCharset.SourceTexts =
        [
            new ClosedLoopReasoningSourceText
            {
                FileName = "arch.md",
                ContentType = "text/markdown; charset=utf-8",
                Content = "Same body.",
            },
        ];

        ReviewCacheManifestBuilder.Build(bare).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(withCharset).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_framing_keys_differ_only_by_casing()
    {
        ClosedLoopReasoningRequest lowerKey = CreateRequest("Architecture note.");
        lowerKey.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["business-outcome"] = "Secure intake",
        };

        ClosedLoopReasoningRequest upperKey = CreateRequest("Architecture note.");
        upperKey.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["Business-Outcome"] = "Secure intake",
        };

        ReviewCacheManifestBuilder.Build(lowerKey).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(upperKey).ContentHash);
    }

    [Fact]
    public void Build_normalizes_framing_answer_keys_and_values()
    {
        ClosedLoopReasoningRequest spaced = CreateRequest("Architecture note.");
        spaced.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [" scope "] = "  security  ",
        };

        ClosedLoopReasoningRequest normalized = CreateRequest("Architecture note.");
        normalized.FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["scope"] = "security",
        };

        ReviewCacheManifestBuilder.Build(spaced).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(normalized).ContentHash);
    }

    [Fact]
    public void Build_matches_content_hash_when_run_id_differs_only_by_hex_letter_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.RunId = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";

        ReviewCacheManifestBuilder.Build(lower).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).ContentHash);
    }

    [Fact]
    public void Build_changes_content_hash_when_client_supplied_run_id_differs_with_same_sources()
    {
        ClosedLoopReasoningRequest runA = CreateRequest("Architecture note.");
        runA.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ClosedLoopReasoningRequest runB = CreateRequest("Architecture note.");
        runB.RunId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

        ReviewCacheManifestBuilder.Build(runA).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(runB).ContentHash);
    }

    [Fact]
    public void BuildWithResolvedRunId_emits_model_fingerprint_for_assigned_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");

        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-assigned",
            RunId = "assigned-run-id",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheManifestBuilder.Build(request).ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                request,
                "assigned-run-id",
                model).ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_matches_hash_when_tenant_differs_only_by_guid_hex_letter_casing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheDependencyManifest lowerTenant =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "run-continue");

        ReviewCacheDependencyManifest upperTenant =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
                "run-continue");

        lowerTenant.ContentHash.Should().Be(upperTenant.ContentHash);
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_partitions_from_continue_build()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;

        ReviewCacheDependencyManifest continueBuild = ReviewCacheManifestBuilder.Build(request);
        ReviewCacheDependencyManifest coalesceManifest =
            ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue");

        coalesceManifest.ContentHash.Should().NotBe(continueBuild.ContentHash);
        coalesceManifest.ReuseReason.Should().Be("closed-loop-continue-existing");
    }

    [Fact]
    public void BuildContinueFromExistingRunCoalesceManifest_changes_hash_when_baseline_model_changes_and_request_run_id_blank()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.ContinueFromExistingRun = true;
        request.RunId = null;

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "run-continue",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ArchitectureKnowledgeModel changed = new()
        {
            ModelId = "model-1",
            RunId = "run-continue",
            Elements =
            [
                new ArchitectureModelElement { ElementId = "el-1", Name = "API" },
                new ArchitectureModelElement { ElementId = "el-2", Name = "Worker" },
            ],
        };

        ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue",
                baseline)
            .ContentHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.BuildContinueFromExistingRunCoalesceManifest(
                request,
                "tenant-cache",
                "run-continue",
                changed)
                .ContentHash);
    }

    [Fact]
    public void BuildWithResolvedRunId_matches_build_content_hash_when_request_carries_same_run_id()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ArchitectureKnowledgeModel baseline = new()
        {
            ModelId = "model-1",
            RunId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
        };

        ReviewCacheDependencyManifest lookupManifest =
            ReviewCacheManifestBuilder.Build(request, baseline, technologyLedgerEntries: null);

        ReviewCacheDependencyManifest storageManifest =
            ReviewCacheManifestBuilder.BuildWithResolvedRunId(
                request,
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                baseline,
                technologyLedgerEntries: null);

        lookupManifest.ContentHash.Should().Be(storageManifest.ContentHash);
    }

    [Fact]
    public void Build_matches_tenant_configuration_hash_when_workspace_differs_only_by_hex_letter_casing()
    {
        ClosedLoopReasoningRequest lower = CreateRequest("Architecture note.");
        lower.WorkspaceId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        ClosedLoopReasoningRequest upper = CreateRequest("Architecture note.");
        upper.WorkspaceId = "AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA";

        ReviewCacheManifestBuilder.Build(lower).TenantConfigurationHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(upper).TenantConfigurationHash);
    }

    [Fact]
    public void Build_changes_tenant_configuration_hash_when_workspace_changes()
    {
        ClosedLoopReasoningRequest workspaceA = CreateRequest("Architecture note.");
        workspaceA.WorkspaceId = "11111111-1111-1111-1111-111111111111";

        ClosedLoopReasoningRequest workspaceB = CreateRequest("Architecture note.");
        workspaceB.WorkspaceId = "22222222-2222-2222-2222-222222222222";

        ReviewCacheManifestBuilder.Build(workspaceA).TenantConfigurationHash
            .Should()
            .NotBe(ReviewCacheManifestBuilder.Build(workspaceB).TenantConfigurationHash);
    }

    private static ClosedLoopReasoningRequest CreateRequest(string content)
    {
        return new ClosedLoopReasoningRequest
        {
            TenantId = "tenant-cache",
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = "arch.md",
                    ContentType = "text/markdown",
                    Content = content,
                },
            ],
        };
    }
}
