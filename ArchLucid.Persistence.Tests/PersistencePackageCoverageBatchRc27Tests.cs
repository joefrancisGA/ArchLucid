using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Alerts.Helpers;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Data.Repositories;

using Dapper;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     RC27 coverage batch for Persistence helpers: alert governance resolution, agent-result enrichment merge,
///     comparison/audit list projections, comparison search predicates, and trial conversion gating.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatchRc27Tests
{
    [Fact]
    public async Task AlertGovernanceResolver_returns_context_content_without_loader_call()
    {
        PolicyPackContentDocument cached = new()
        {
            ComplianceRuleKeys = ["cached-key"],
        };
        AlertEvaluationContext context = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            EffectiveGovernanceContent = cached,
        };
        Mock<IEffectiveGovernanceLoader> loader = new();

        PolicyPackContentDocument resolved = await AlertGovernanceResolver.ResolveAsync(
            context,
            loader.Object,
            CancellationToken.None);

        resolved.Should().BeSameAs(cached);
        loader.Verify(
            l => l.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AlertGovernanceResolver_loads_when_context_content_is_null()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid workspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid projectId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa");
        PolicyPackContentDocument loaded = new()
        {
            ComplianceRuleKeys = ["loaded-key"],
        };
        AlertEvaluationContext context = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            EffectiveGovernanceContent = null,
        };
        Mock<IEffectiveGovernanceLoader> loader = new();
        loader
            .Setup(l => l.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(loaded);

        PolicyPackContentDocument resolved = await AlertGovernanceResolver.ResolveAsync(
            context,
            loader.Object,
            CancellationToken.None);

        resolved.Should().BeSameAs(loaded);
        loader.Verify(
            l => l.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public void AgentResultEnrichmentMerger_returns_base_when_enrichments_empty()
    {
        AgentResult baseResult = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run1",
            Confidence = 0.4,
        };
        IReadOnlyList<AgentResult> baseResults = [baseResult];
        Dictionary<string, AgentResultEnrichmentRecord> enrichments = new(StringComparer.Ordinal);

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.Apply(baseResults, enrichments);

        merged.Should().BeSameAs(baseResults);
    }

    [Fact]
    public void AgentResultEnrichmentMerger_keeps_unmatched_results_and_applies_calibrated_confidence()
    {
        AgentResult matched = new()
        {
            ResultId = "match",
            TaskId = "t1",
            RunId = "run1",
            Confidence = 0.5,
            CalibratedConfidence = null,
        };
        AgentResult unmatched = new()
        {
            ResultId = "other",
            TaskId = "t2",
            RunId = "run1",
            Confidence = 0.2,
        };
        Dictionary<string, AgentResultEnrichmentRecord> enrichments = new(StringComparer.Ordinal)
        {
            ["match"] = new AgentResultEnrichmentRecord
            {
                ResultId = "match",
                CalibratedConfidence = 0.91,
            },
        };

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.Apply([matched, unmatched], enrichments);

        merged.Should().HaveCount(2);
        merged[0].ResultId.Should().Be("match");
        merged[0].CalibratedConfidence.Should().Be(0.91);
        merged[0].Confidence.Should().Be(0.5);
        merged[1].Should().BeSameAs(unmatched);
    }

    [Fact]
    public void AgentResultEnrichmentMerger_replaces_result_from_enriched_json()
    {
        AgentResult baseResult = new()
        {
            ResultId = "r-json",
            TaskId = "t1",
            RunId = "run1",
            Confidence = 0.1,
        };
        AgentResult enrichedShape = new()
        {
            ResultId = "r-json",
            TaskId = "t1",
            RunId = "run1",
            Confidence = 0.88,
            CalibratedConfidence = 0.77,
            Claims = ["enriched-claim"],
        };
        string enrichedJson = System.Text.Json.JsonSerializer.Serialize(enrichedShape, ContractJson.Default);
        Dictionary<string, AgentResultEnrichmentRecord> enrichments = new(StringComparer.Ordinal)
        {
            ["r-json"] = new AgentResultEnrichmentRecord
            {
                ResultId = "r-json",
                CalibratedConfidence = 0.5,
                EnrichedResultJson = enrichedJson,
            },
        };

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.Apply([baseResult], enrichments);

        merged.Should().ContainSingle();
        merged[0].Confidence.Should().Be(0.88);
        merged[0].CalibratedConfidence.Should().Be(0.77);
        merged[0].Claims.Should().ContainSingle().Which.Should().Be("enriched-claim");
    }

    [Fact]
    public void AgentResultEnrichmentMerger_ignores_whitespace_enriched_json()
    {
        AgentResult baseResult = new()
        {
            ResultId = "r-ws",
            TaskId = "t1",
            RunId = "run1",
            Confidence = 0.3,
        };
        Dictionary<string, AgentResultEnrichmentRecord> enrichments = new(StringComparer.Ordinal)
        {
            ["r-ws"] = new AgentResultEnrichmentRecord
            {
                ResultId = "r-ws",
                CalibratedConfidence = 0.66,
                EnrichedResultJson = "   ",
            },
        };

        IReadOnlyList<AgentResult> merged = AgentResultEnrichmentMerger.Apply([baseResult], enrichments);

        merged.Should().ContainSingle();
        merged[0].CalibratedConfidence.Should().Be(0.66);
        merged[0].Confidence.Should().Be(0.3);
    }

    [Fact]
    public void AgentResultEnrichmentMerger_throws_when_enriched_json_is_invalid()
    {
        AgentResult baseResult = new()
        {
            ResultId = "r-bad",
            TaskId = "t1",
            RunId = "run1",
        };
        Dictionary<string, AgentResultEnrichmentRecord> enrichments = new(StringComparer.Ordinal)
        {
            ["r-bad"] = new AgentResultEnrichmentRecord
            {
                ResultId = "r-bad",
                EnrichedResultJson = "{ not-json",
            },
        };

        Action act = () => AgentResultEnrichmentMerger.Apply([baseResult], enrichments);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*r-bad*")
            .WithInnerException<System.Text.Json.JsonException>();
    }

    [Fact]
    public void ComparisonRecordListProjection_clears_payload_and_normalizes_run_ids()
    {
        Guid left = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid right = Guid.Parse("11111111-2222-3333-4444-555555555555");
        ComparisonRecord row = new()
        {
            ComparisonRecordId = "cmp-1",
            ComparisonType = "manifest",
            LeftRunId = left.ToString("D").ToUpperInvariant(),
            RightRunId = right.ToString("D"),
            LeftManifestVersion = "v1",
            RightManifestVersion = "v2",
            LeftExportRecordId = "lex",
            RightExportRecordId = "rex",
            Format = "json",
            SummaryMarkdown = "summary",
            PayloadJson = """{"heavy":true}""",
            Notes = "n",
            CreatedUtc = DateTime.UtcNow,
            Label = "label",
            Tags = ["a", "b"],
        };

        IReadOnlyList<ComparisonRecord> projected =
            ComparisonRecordListProjection.MaterializeWithoutPayloadJson([row]);

        projected.Should().ContainSingle();
        ComparisonRecord item = projected[0];
        item.PayloadJson.Should().BeEmpty();
        item.ComparisonRecordId.Should().Be("cmp-1");
        item.ComparisonType.Should().Be("manifest");
        item.LeftRunId.Should().Be(left.ToString("N"));
        item.RightRunId.Should().Be(right.ToString("N"));
        item.LeftManifestVersion.Should().Be("v1");
        item.RightManifestVersion.Should().Be("v2");
        item.LeftExportRecordId.Should().Be("lex");
        item.RightExportRecordId.Should().Be("rex");
        item.SummaryMarkdown.Should().Be("summary");
        item.Notes.Should().Be("n");
        item.Label.Should().Be("label");
        item.Tags.Should().BeEquivalentTo("a", "b");
        item.Tags.Should().NotBeSameAs(row.Tags);
    }

    [Fact]
    public void AuditEventListProjection_replaces_data_json_with_empty_object()
    {
        AuditEvent row = new()
        {
            EventId = Guid.NewGuid(),
            OccurredUtc = DateTime.UtcNow,
            EventType = "TestEvent",
            ActorUserId = "u1",
            ActorUserName = "User",
            ExplicitActor = true,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            ArtifactId = Guid.NewGuid(),
            DataJson = """{"secret":"value"}""",
            CorrelationId = "corr-1",
        };

        IReadOnlyList<AuditEvent> projected = AuditEventListProjection.MaterializeWithoutDataJson([row]);

        projected.Should().ContainSingle();
        AuditEvent item = projected[0];
        item.DataJson.Should().Be("{}");
        item.EventId.Should().Be(row.EventId);
        item.EventType.Should().Be("TestEvent");
        item.ActorUserId.Should().Be("u1");
        item.ActorUserName.Should().Be("User");
        item.ExplicitActor.Should().BeTrue();
        item.TenantId.Should().Be(row.TenantId);
        item.WorkspaceId.Should().Be(row.WorkspaceId);
        item.ProjectId.Should().Be(row.ProjectId);
        item.RunId.Should().Be(row.RunId);
        item.ManifestId.Should().Be(row.ManifestId);
        item.ArtifactId.Should().Be(row.ArtifactId);
        item.CorrelationId.Should().Be("corr-1");
    }

    [Fact]
    public void ComparisonRecordSearchPredicateBuilder_appends_no_filters_for_blank_inputs()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: "  ",
            leftRunId: null,
            rightRunId: "",
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: " ",
            rightExportRecordId: null,
            label: null,
            tags: null);

        conditions.Should().BeEmpty();
    }

    [Fact]
    public void ComparisonRecordSearchPredicateBuilder_appends_all_valid_filters_and_skips_blank_tags()
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();
        Guid left = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid right = Guid.Parse("11111111-2222-3333-4444-555555555555");
        DateTime from = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime to = new(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc);

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: "manifest",
            leftRunId: left.ToString("D"),
            rightRunId: right.ToString("N"),
            createdFromUtc: from,
            createdToUtc: to,
            leftExportRecordId: "lex",
            rightExportRecordId: "rex",
            label: "release",
            tags: ["tag-a", "  ", "tag-b"]);

        conditions.Should().Contain("ComparisonType = @ComparisonType");
        conditions.Should().Contain("LeftRunId = @LeftRunId");
        conditions.Should().Contain("RightRunId = @RightRunId");
        conditions.Should().Contain("CreatedUtc >= @CreatedFromUtc");
        conditions.Should().Contain("CreatedUtc <= @CreatedToUtc");
        conditions.Should().Contain("LeftExportRecordId = @LeftExportRecordId");
        conditions.Should().Contain("RightExportRecordId = @RightExportRecordId");
        conditions.Should().Contain("Label = @Label");
        conditions.Should().Contain(c => c.Contains("@Tag0", StringComparison.Ordinal));
        conditions.Should().Contain(c => c.Contains("@Tag2", StringComparison.Ordinal));
        conditions.Should().NotContain(c => c.Contains("@Tag1", StringComparison.Ordinal));
        parameters.Get<string>("@ComparisonType").Should().Be("manifest");
        parameters.Get<Guid>("@LeftRunId").Should().Be(left);
        parameters.Get<Guid>("@RightRunId").Should().Be(right);
        parameters.Get<DateTime>("@CreatedFromUtc").Should().Be(from);
        parameters.Get<DateTime>("@CreatedToUtc").Should().Be(to);
        parameters.Get<string>("@LeftExportRecordId").Should().Be("lex");
        parameters.Get<string>("@RightExportRecordId").Should().Be("rex");
        parameters.Get<string>("@Label").Should().Be("release");
        parameters.Get<string>("@Tag0").Should().Be("tag-a");
        parameters.Get<string>("@Tag2").Should().Be("tag-b");
    }

    [Theory]
    [InlineData("not-a-guid", null)]
    [InlineData(null, "also-bad")]
    public void ComparisonRecordSearchPredicateBuilder_adds_impossible_predicate_for_invalid_run_ids(
        string? leftRunId,
        string? rightRunId)
    {
        List<string> conditions = [];
        DynamicParameters parameters = new();

        ComparisonRecordSearchPredicateBuilder.AppendFilters(
            conditions,
            parameters,
            comparisonType: null,
            leftRunId: leftRunId,
            rightRunId: rightRunId,
            createdFromUtc: null,
            createdToUtc: null,
            leftExportRecordId: null,
            rightExportRecordId: null,
            label: null,
            tags: []);

        conditions.Should().Contain("1 = 0");
        conditions.Should().NotContain(c => c.Contains("LeftRunId =", StringComparison.Ordinal));
        conditions.Should().NotContain(c => c.Contains("RightRunId =", StringComparison.Ordinal));
    }

    [Fact]
    public async Task BillingTrialConversionGate_allows_noop_and_whitespace_providers()
    {
        Mock<IBillingLedger> ledger = new();
        Mock<IOptionsMonitor<BillingOptions>> noopOptions = new();
        noopOptions.Setup(o => o.CurrentValue).Returns(new BillingOptions { Provider = "  Noop  " });
        BillingTrialConversionGate noopGate = new(noopOptions.Object, ledger.Object);

        await noopGate.Invoking(g => g.EnsureManualConversionAllowedAsync(Guid.NewGuid(), CancellationToken.None))
            .Should()
            .NotThrowAsync();

        Mock<IOptionsMonitor<BillingOptions>> blankOptions = new();
        blankOptions.Setup(o => o.CurrentValue).Returns(new BillingOptions { Provider = "   " });
        BillingTrialConversionGate blankGate = new(blankOptions.Object, ledger.Object);

        await blankGate.Invoking(g => g.EnsureManualConversionAllowedAsync(Guid.NewGuid(), CancellationToken.None))
            .Should()
            .NotThrowAsync();

        ledger.Verify(
            l => l.TenantHasActiveSubscriptionAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BillingTrialConversionGate_allows_paid_provider_with_active_subscription()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions { Provider = BillingProviderNames.Stripe });
        Mock<IBillingLedger> ledger = new();
        ledger.Setup(l => l.TenantHasActiveSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        BillingTrialConversionGate sut = new(options.Object, ledger.Object);

        await sut.Invoking(g => g.EnsureManualConversionAllowedAsync(tenantId, CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task BillingTrialConversionGate_blocks_paid_provider_without_subscription()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions { Provider = "Stripe" });
        Mock<IBillingLedger> ledger = new();
        ledger.Setup(l => l.TenantHasActiveSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        BillingTrialConversionGate sut = new(options.Object, ledger.Object);

        Func<Task> act = () => sut.EnsureManualConversionAllowedAsync(tenantId, CancellationToken.None);

        await act.Should().ThrowAsync<BillingConversionBlockedException>()
            .WithMessage("*no Active subscription*");
    }

    [Fact]
    public void BillingTrialConversionGate_ctor_rejects_null_dependencies()
    {
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        Mock<IBillingLedger> ledger = new();

        Action nullOptions = () => _ = new BillingTrialConversionGate(null!, ledger.Object);
        Action nullLedger = () => _ = new BillingTrialConversionGate(options.Object, null!);

        nullOptions.Should().Throw<ArgumentNullException>().WithParameterName("options");
        nullLedger.Should().Throw<ArgumentNullException>().WithParameterName("ledger");
    }
}
