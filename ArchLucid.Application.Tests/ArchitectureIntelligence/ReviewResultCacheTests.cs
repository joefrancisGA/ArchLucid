using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ReviewResultCacheTests
{
    [Fact]
    public void TryGet_returns_false_after_entry_expires()
    {
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 8, 25, 12, 0, 0, TimeSpan.Zero));
        ReviewResultCache cache = new(clock);
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-1" };
        ClosedLoopReasoningResult result = new() { RunId = "run-1" };

        cache.Set(manifest, result);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();
        cached!.RunId.Should().Be("run-1");

        clock.Advance(TimeSpan.FromHours(5));
        cache.TryGet(manifest, out ClosedLoopReasoningResult? expired).Should().BeFalse();
        expired.Should().BeNull();
    }

    [Fact]
    public void TryGet_returns_snapshot_isolated_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-isolated" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "run-isolated",
            Model = new ArchitectureKnowledgeModel
            {
                ModelId = "model-isolated",
                Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
            },
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.CacheHit = true;
        cached.Model.Elements[0].Name = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.CacheHit.Should().BeFalse();
        again.Model.Elements[0].Name.Should().Be("API");
    }

    [Fact]
    public void TryGet_isolates_must_not_fail_and_product_payloads_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-payload-isolated" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "run-payload",
            MustNotFailViolations =
            [
                new MustNotFailViolation
                {
                    Class = MustNotFailClass.FabricatedCitation,
                    Message = "Blocked",
                    Blocked = true,
                    FindingId = "finding-1",
                },
            ],
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "product-finding-1",
                    Title = "Gap",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Rationale = "Rationale.",
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.MustNotFailViolations[0].Blocked = false;
        cached.ProductFindings[0].Title = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.MustNotFailViolations[0].Blocked.Should().BeTrue();
        again.ProductFindings[0].Title.Should().Be("Gap");
    }

    [Fact]
    public void TryGet_isolates_product_finding_payload_and_trace_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-finding-deep" };
        ClosedLoopReasoningResult stored = new()
        {
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "product-finding-trace",
                    Title = "Gap",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Rationale = "Rationale.",
                    Properties = new Dictionary<string, string> { ["key"] = "value" },
                    Trace = new ArchLucid.Contracts.Findings.ExplainabilityTrace
                    {
                        Citations = ["citation-1"],
                        Notes = ["note-1"],
                    },
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.ProductFindings[0].Properties["key"] = "mutated";
        cached.ProductFindings[0].Trace.Citations[0] = "mutated";
        cached.ProductFindings[0].Trace.Notes.Add("added");

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.ProductFindings[0].Properties["key"].Should().Be("value");
        again.ProductFindings[0].Trace.Citations.Should().Equal("citation-1");
        again.ProductFindings[0].Trace.Notes.Should().Equal("note-1");
    }

    [Fact]
    public void TryGet_isolates_model_diff_after_model_and_entries_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-model-diff" };
        ClosedLoopReasoningResult stored = new()
        {
            ModelDiffs =
            [
                new ArchitectureModelDiff
                {
                    RecommendationId = "rec-1",
                    Entries =
                    [
                        new ArchitectureModelDiffEntry
                        {
                            ElementId = "el-1",
                            ChangeKind = "Added",
                            ElementKind = ArchitectureElementKind.Component,
                            Description = "Added API",
                        },
                    ],
                    BeforeModel = new ArchitectureKnowledgeModel
                    {
                        Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
                    },
                    AfterModel = new ArchitectureKnowledgeModel
                    {
                        Elements = [new ArchitectureModelElement { ElementId = "el-1", Name = "API" }],
                    },
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.ModelDiffs[0].Entries[0].Description = "mutated";
        cached.ModelDiffs[0].AfterModel.Elements[0].Name = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        again!.ModelDiffs[0].Entries[0].Description.Should().Be("Added API");
        again.ModelDiffs[0].AfterModel.Elements[0].Name.Should().Be("API");
    }

    [Fact]
    public void TryGet_isolates_dictionary_product_finding_payload_from_stored_entry()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-dict-payload" };
        Dictionary<string, string> payload = new() { ["key"] = "value" };
        ClosedLoopReasoningResult stored = new()
        {
            ProductFindings =
            [
                new ArchLucid.Contracts.Findings.Finding
                {
                    FindingId = "product-finding-payload",
                    Title = "Gap",
                    FindingType = "gap",
                    Category = "security",
                    EngineType = "specialist",
                    Severity = ArchLucid.Contracts.Findings.FindingSeverity.Error,
                    Rationale = "Rationale.",
                    Payload = payload,
                },
            ],
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        ((Dictionary<string, string>)cached!.ProductFindings[0].Payload!)["key"] = "mutated";

        cache.TryGet(manifest, out ClosedLoopReasoningResult? again).Should().BeTrue();
        ((Dictionary<string, string>)again!.ProductFindings[0].Payload!)["key"].Should().Be("value");
    }

    [Fact]
    public void Set_stores_result_without_publish_side_effects()
    {
        ReviewResultCache cache = new();
        ReviewCacheDependencyManifest manifest = new() { ContentHash = "hash-publish-sanitized" };
        ClosedLoopReasoningResult stored = new()
        {
            RunId = "run-published",
            PublishedToProduct = true,
            PublishedFindingsSnapshotId = Guid.NewGuid(),
            PublishedRecommendationCount = 5,
            PublishSkipReason = "published",
        };

        cache.Set(manifest, stored);
        cache.TryGet(manifest, out ClosedLoopReasoningResult? cached).Should().BeTrue();

        cached!.PublishedToProduct.Should().BeFalse();
        cached.PublishedFindingsSnapshotId.Should().BeNull();
        cached.PublishedRecommendationCount.Should().Be(0);
        cached.PublishSkipReason.Should().BeNull();
    }
}
