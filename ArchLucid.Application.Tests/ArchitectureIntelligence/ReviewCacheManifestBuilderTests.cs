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
    public void Build_emits_ledger_fingerprint_when_run_id_set_even_if_ledger_missing()
    {
        ClosedLoopReasoningRequest request = CreateRequest("Architecture note.");
        request.RunId = "run-without-ledger";

        ReviewCacheManifestBuilder.Build(request, null, null).ContentHash
            .Should()
            .Be(ReviewCacheManifestBuilder.Build(request, null, []).ContentHash);
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
