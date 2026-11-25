using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class OperationalSecurityFindingIngestServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    [Fact]
    public async Task IngestBatchAsync_same_payload_twice_marks_second_item_deduplicated()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        OperationalSecurityFindingIngestService sut = new(
            repository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        OperationalSecurityFindingIngestItem item = CreateItem("scanner-a", "finding-100");

        OperationalSecurityFindingBatchIngestResult first = await sut.IngestBatchAsync(
            scope,
            [item],
            "actor@test",
            CancellationToken.None);

        OperationalSecurityFindingBatchIngestResult second = await sut.IngestBatchAsync(
            scope,
            [item],
            "actor@test",
            CancellationToken.None);

        first.IngestedCount.Should().Be(1);
        first.DeduplicatedCount.Should().Be(0);
        first.Items[0].FindingId.Should().NotBeNull();

        second.DeduplicatedCount.Should().Be(1);
        second.IngestedCount.Should().Be(0);
        second.Items[0].WasDeduplicated.Should().BeTrue();
        second.Items[0].FindingId.Should().Be(first.Items[0].FindingId);

        repository.StoredFindings.Should().HaveCount(1);
        repository.StoredObservations.Should().HaveCount(1);
    }

    [Fact]
    public async Task TryGetDetailAsync_foreign_tenant_returns_not_found()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        Mock<IAuditService> auditService = new();

        OperationalSecurityFindingIngestService sut = new(
            repository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scopeA = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        ScopeContext scopeB = new()
        {
            TenantId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4"),
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        OperationalSecurityFindingBatchIngestResult ingest = await sut.IngestBatchAsync(
            scopeA,
            [CreateItem("scanner-b", "finding-200")],
            "actor@test",
            CancellationToken.None);

        Guid findingId = ingest.Items[0].FindingId!.Value;

        OperationalSecurityFindingDetailResult detail = await sut.TryGetDetailAsync(scopeB, findingId);

        detail.Succeeded.Should().BeFalse();
        detail.Finding.Should().BeNull();
    }

    [Fact]
    public async Task IngestBatchAsync_same_natural_key_in_different_project_creates_distinct_finding()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext firstScope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        ScopeContext secondScope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        };

        OperationalSecurityFindingIngestItem item = CreateItem("scanner-shared", "finding-shared");

        OperationalSecurityFindingBatchIngestResult first =
            await sut.IngestBatchAsync(firstScope, [item], "actor@test");
        OperationalSecurityFindingBatchIngestResult second =
            await sut.IngestBatchAsync(secondScope, [item], "actor@test");

        first.IngestedCount.Should().Be(1);
        second.IngestedCount.Should().Be(1);
        second.DeduplicatedCount.Should().Be(0);
        repository.StoredFindings.Should().HaveCount(2);
        repository.StoredFindings.Select(row => row.ProjectId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task TryGetDetailAsync_foreign_project_returns_not_found()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext sourceScope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        OperationalSecurityFindingBatchIngestResult ingest =
            await sut.IngestBatchAsync(sourceScope, [CreateItem("scanner-project", "finding-project")], "actor@test");

        ScopeContext foreignProject = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
        };

        OperationalSecurityFindingDetailResult detail =
            await sut.TryGetDetailAsync(foreignProject, ingest.Items[0].FindingId!.Value);

        detail.Succeeded.Should().BeFalse();
        detail.Finding.Should().BeNull();
    }

    [Theory]
    [InlineData("Provider", "Fixed", "NotRequired", OperationalSecurityFindingStatus.Informational)]
    [InlineData("Provider", "Pending", "NotRequired", OperationalSecurityFindingStatus.Open)]
    [InlineData("Customer", "NotApplicable", "Required", OperationalSecurityFindingStatus.Open)]
    [InlineData("Shared", "Fixed", "Required", OperationalSecurityFindingStatus.Open)]
    [InlineData("Undetermined", "Unknown", "Unknown", OperationalSecurityFindingStatus.Open)]
    public async Task Reported_advisory_classifies_work_without_claiming_verification(
        string owner, string fix, string customer, OperationalSecurityFindingStatus expected)
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        OperationalSecurityFindingBatchIngestResult result = await sut.IngestBatchAsync(
            scope, [CreateAdvisory(owner, fix, customer, OperationalSecurityFindingStatus.Open)], "actor@test");

        result.IngestedCount.Should().Be(1);
        OperationalSecurityFindingRecord row = repository.StoredFindings.Should().ContainSingle().Which;
        row.Status.Should().Be(expected);
        repository.StoredObservations.Should().ContainSingle().Which.Status.Should().Be(expected);
        repository.StoredMetadata.Should().ContainSingle().Which.MetadataKey.Should().Be(AdvisoryRemediationEvidence.MetadataKey);
        RemediationFactoryFindingMetricsAggregate metrics =
            await ((IOperationalSecurityFindingRepository)repository).GetFactoryFindingMetricsAggregateInScopeAsync(
                scope.ToProjectScopeKey(), row.CreatedUtc.AddMinutes(-1), row.CreatedUtc.AddMinutes(1));
        int actionable = expected == OperationalSecurityFindingStatus.Informational ? 0 : 1;
        metrics.OpenFindings.Should().Be(actionable);
        metrics.CreatedThisWeek.Should().Be(actionable);
    }

    [Fact]
    public async Task Customer_advisory_cannot_be_closed_by_ingest_or_compensating_control()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        OperationalSecurityFindingBatchIngestResult initial = await sut.IngestBatchAsync(scope,
            [CreateAdvisory("Customer", "NotApplicable", "Required", OperationalSecurityFindingStatus.Open)], "actor@test");
        OperationalSecurityFindingBatchIngestResult invalid = await sut.IngestBatchAsync(scope,
            [CreateAdvisory("Customer", "NotApplicable", "Required", OperationalSecurityFindingStatus.Closed),
             new OperationalSecurityFindingIngestItem
             {
                 Provider = CloudProvider.Azure, SourceSystem = "operator", SourceFindingId = "advisory-1",
                 Title = "Unverified close", Status = OperationalSecurityFindingStatus.Closed,
             }], "actor@test");

        initial.IngestedCount.Should().Be(1);
        invalid.FailedCount.Should().Be(2);
        repository.StoredFindings.Should().ContainSingle().Which.Status.Should().Be(OperationalSecurityFindingStatus.Open);
        repository.StoredObservations.Should().ContainSingle();
    }

    private static OperationalSecurityFindingIngestItem CreateAdvisory(
        string owner, string fix, string customer, OperationalSecurityFindingStatus status) =>
        new()
        {
            Provider = CloudProvider.Azure,
            SourceSystem = "operator",
            SourceFindingId = "advisory-1",
            CloudResourceId = ProjectId,
            Title = "Runtime advisory",
            Status = status,
            Metadata = new Dictionary<string, string?>
            {
                [AdvisoryRemediationEvidence.MetadataKey] = System.Text.Json.JsonSerializer.Serialize(new
                {
                    advisoryId = "ADVISORY-1",
                    sourceUrl = "https://example.com/advisory-1",
                    owner,
                    providerFix = fix,
                    customerAction = customer,
                    compensatingControlEvidenceReference = "waf-evidence",
                }),
            },
        };

    [Fact]
    public async Task IngestBatchAsync_stale_changed_payload_does_not_reopen_or_replace_evidence()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime latest = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        OperationalSecurityFindingIngestItem closed = CreateObservation(latest, OperationalSecurityFindingStatus.Closed, "fixed");
        OperationalSecurityFindingIngestItem delayed = CreateObservation(latest.AddDays(-1), OperationalSecurityFindingStatus.Open, "old");

        await sut.IngestBatchAsync(scope, [closed], "actor@test");
        OperationalSecurityFindingBatchIngestResult result = await sut.IngestBatchAsync(scope, [delayed], "actor@test");

        result.FailedCount.Should().Be(1);
        result.Items[0].WasDeduplicated.Should().BeFalse();
        result.Items[0].ErrorMessage.Should().Be("Observation is older than the current operational finding.");
        OperationalSecurityFindingRecord stored = repository.StoredFindings.Should().ContainSingle().Which;
        stored.Status.Should().Be(OperationalSecurityFindingStatus.Closed);
        stored.LastObservedUtc.Should().Be(latest);
        stored.UpdatedUtc.Should().Be(latest);
        stored.RawEvidenceReference.Should().Be("fixed");
        repository.StoredMetadata.Should().ContainSingle().Which.MetadataValue.Should().Be("fixed");
        repository.StoredObservations.Should().ContainSingle();
    }

    [Fact]
    public async Task IngestBatchAsync_stale_identical_payload_deduplicates_without_moving_watermark()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime latest = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        OperationalSecurityFindingBatchIngestResult initial = await sut.IngestBatchAsync(
            scope, [CreateObservation(latest, OperationalSecurityFindingStatus.Open, "same")], "actor@test");
        OperationalSecurityFindingBatchIngestResult replay = await sut.IngestBatchAsync(
            scope, [CreateObservation(latest.AddDays(-1), OperationalSecurityFindingStatus.Open, "same")], "actor@test");

        replay.DeduplicatedCount.Should().Be(1);
        replay.Items[0].FindingId.Should().Be(initial.Items[0].FindingId);
        OperationalSecurityFindingRecord stored = repository.StoredFindings.Should().ContainSingle().Which;
        stored.LastObservedUtc.Should().Be(latest);
        stored.UpdatedUtc.Should().Be(latest);
        repository.StoredObservations.Should().ContainSingle();
    }

    [Fact]
    public async Task IngestBatchAsync_newer_open_observation_still_records_recurrence()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository,
            Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime closed = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        DateTime recurred = closed.AddDays(1);

        await sut.IngestBatchAsync(
            scope, [CreateObservation(closed, OperationalSecurityFindingStatus.Closed, "fixed")], "actor@test");
        OperationalSecurityFindingBatchIngestResult result = await sut.IngestBatchAsync(
            scope, [CreateObservation(recurred, OperationalSecurityFindingStatus.Open, "regression")], "actor@test");

        result.IngestedCount.Should().Be(1);
        OperationalSecurityFindingRecord stored = repository.StoredFindings.Should().ContainSingle().Which;
        stored.Status.Should().Be(OperationalSecurityFindingStatus.Recurred);
        stored.LastObservedUtc.Should().Be(recurred);
        stored.RawEvidenceReference.Should().Be("regression");
        repository.StoredObservations.Should().HaveCount(2);
    }

    private static OperationalSecurityFindingIngestItem CreateObservation(
        DateTime observedUtc,
        OperationalSecurityFindingStatus status,
        string evidence) =>
        new()
        {
            Provider = CloudProvider.Azure,
            SourceSystem = "scanner",
            SourceFindingId = "finding-chronology",
            Title = "Runtime vulnerability",
            ObservedUtc = observedUtc,
            Status = status,
            RawEvidenceReference = evidence,
            Metadata = new Dictionary<string, string?> { ["proof"] = evidence },
        };

    [Fact]
    public async Task Publisher_and_mirror_coalesce_without_overwriting_obligations()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime first = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        OperationalSecurityFindingIngestItem publisher = CreateAliasedAdvisory("msrc", "MSRC-111", first);
        OperationalSecurityFindingIngestItem mirror = CreateAliasedAdvisory(
            "mirror", "MIR-111", first.AddDays(1), referenceOnly: true, providerFixed: true);
        (await sut.IngestBatchAsync(scope, [mirror], "service@test")).FailedCount.Should().Be(1);
        OperationalSecurityFindingBatchIngestResult initial = await sut.IngestBatchAsync(scope, [publisher], "service@test");
        OperationalSecurityFindingBatchIngestResult replay = await sut.IngestBatchAsync(scope, [mirror, mirror], "feed@test");

        replay.DeduplicatedCount.Should().Be(2);
        replay.Items.Should().OnlyContain(result => result.FindingId == initial.Items[0].FindingId);
        OperationalSecurityFindingRecord row = repository.StoredFindings.Should().ContainSingle().Which;
        row.Status.Should().Be(OperationalSecurityFindingStatus.Open);
        row.SourceFindingId.Should().StartWith("CVE-2026-12345:");
        row.LastObservedUtc.Should().Be(first);
        repository.StoredObservations.Should().ContainSingle();
        repository.StoredMetadata.Count(value => value.MetadataKey.StartsWith("securenow.advisory.source.", StringComparison.Ordinal))
            .Should().Be(2);
    }

    [Fact]
    public async Task Revision_changes_only_target_deployment_and_cannot_come_from_a_different_publisher()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime first = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        Guid other = Guid.NewGuid();
        await sut.IngestBatchAsync(scope,
            [CreateAliasedAdvisory("msrc", "MSRC-111", first), CreateAliasedAdvisory("msrc", "MSRC-111", first) with
                { CloudResourceId = other }], "service@test");
        OperationalSecurityFindingBatchIngestResult ignore = await sut.IngestBatchAsync(scope,
            [CreateAliasedAdvisory("new-feed", "MSRC-111", first.AddDays(1), providerFixed: true)], "service@test");
        ignore.FailedCount.Should().Be(1);

        OperationalSecurityFindingBatchIngestResult cosmetic = await sut.IngestBatchAsync(scope,
            [CreateAliasedAdvisory("msrc", "another-format", first.AddDays(2)) with { Title = "Retitled" }], "service@test");
        cosmetic.DeduplicatedCount.Should().Be(1);
        (await sut.IngestBatchAsync(scope,
            [CreateAliasedAdvisory("msrc", "MSRC-111", first.AddDays(1), providerFixed: true)], "service@test"))
            .FailedCount.Should().Be(1, "the authoritative replay advances its chronology without creating a new alert");

        OperationalSecurityFindingBatchIngestResult revision = await sut.IngestBatchAsync(scope,
            [CreateAliasedAdvisory("msrc", "MSRC-111", first.AddDays(3), providerFixed: true)], "service@test");
        revision.IngestedCount.Should().Be(1);
        repository.StoredFindings.Should().HaveCount(2);
        repository.StoredFindings.Single(row => row.CloudResourceId == ProjectId).Status
            .Should().Be(OperationalSecurityFindingStatus.Informational);
        repository.StoredFindings.Single(row => row.CloudResourceId == other).Status
            .Should().Be(OperationalSecurityFindingStatus.Open);
        repository.StoredObservations.Should().HaveCount(3);
    }

    [Theory]
    [InlineData(false, false, null)]
    [InlineData(true, false, "existing-runtime-control")]
    [InlineData(true, true, null)]
    public async Task Advisory_uses_only_one_human_reviewed_crosswalk_control(
        bool reviewed, bool ambiguous, string? expected)
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        Mock<ISecurityCrosswalkService> crosswalk = new();
        SecurityCrosswalkMappingRecord[] mappings = ambiguous
            ? [MakeMapping("existing-runtime-control"), MakeMapping("another-control")]
            : [MakeMapping("existing-runtime-control")];
        crosswalk.Setup(service => service.ResolveEvaluationMappingsAsync(TenantId,
                SecurityCrosswalkEndpointKind.DefenderRecommendation, "defender-recommendation", "2026.1",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SecurityCrosswalkResolveResult { EvaluationEligibleMappings = mappings });
        OperationalSecurityFindingIngestService sut = new(repository, Mock.Of<IAuditService>(),
            NullLogger<OperationalSecurityFindingIngestService>.Instance, crosswalk.Object);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime first = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        (await sut.IngestBatchAsync(scope, [CreateAliasedAdvisory("msrc", "MSRC-111", first)], "service@test"))
            .IngestedCount.Should().Be(1);
        repository.StoredFindings.Should().ContainSingle().Which.ControlId.Should().Be(expected);

        SecurityCrosswalkMappingRecord MakeMapping(string id) => new()
        {
            TargetEndpointId = id,
            TargetEndpointKind = SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
            MappingType = SecurityCrosswalkMappingType.Mitigates,
            HumanVerified = reviewed,
        };
    }

    [Fact]
    public async Task Same_cve_on_one_resource_keeps_distinct_target_components()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        OperationalSecurityFindingIngestItem first = CreateAliasedAdvisory(
            "msrc", "MSRC-111", new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        const string aliasKey = "securenow.advisory-alias.v1";
        Dictionary<string, string?> metadata = first.Metadata.ToDictionary(pair => pair.Key, pair => pair.Value);
        metadata[aliasKey] = metadata[aliasKey]!.Replace("runtime/app", "runtime/admin", StringComparison.Ordinal);

        OperationalSecurityFindingBatchIngestResult result =
            await sut.IngestBatchAsync(scope, [first, first with { Metadata = metadata }], "service@test");

        result.IngestedCount.Should().Be(2);
        repository.StoredFindings.Select(row => row.SourceFindingId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task Caller_cannot_write_reserved_canonical_source_or_provenance()
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        OperationalSecurityFindingBatchIngestResult result = await sut.IngestBatchAsync(scope,
            [CreateItem("ArchLucid.SecureNow.Advisory", "forged"), CreateItem("feed", "forged") with
            {
                Metadata = new Dictionary<string, string?> { ["securenow.advisory.source.fake"] = "forged" },
            }], "service@test");

        result.FailedCount.Should().Be(2);
        repository.StoredFindings.Should().BeEmpty();
    }

    [Theory]
    [InlineData(null, true)]
    [InlineData("high", false)]
    public async Task Canonical_revision_reopens_a_closed_finding_only_when_effective_facts_change(
        string? severity, bool deduplicated)
    {
        InMemoryOperationalSecurityFindingRepository repository = new();
        OperationalSecurityFindingIngestService sut = new(
            repository, Mock.Of<IAuditService>(), NullLogger<OperationalSecurityFindingIngestService>.Instance);
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
        DateTime first = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        Guid pathId = Guid.NewGuid();
        var initial = CreateAliasedAdvisory("msrc", "MSRC-111", first) with
        {
            RiskScore = 9.5m, Exploitability = "Known", Exposure = "Public",
            BusinessCriticality = "High", BlastRadius = "Large", PathId = pathId,
        };
        (await sut.IngestBatchAsync(scope, [initial], "service@test")).IngestedCount.Should().Be(1);

        OperationalSecurityFindingRecord prior = repository.StoredFindings.Should().ContainSingle().Which;
        repository.StoredFindings[0] = new OperationalSecurityFindingMutation
        {
            FindingId = prior.FindingId,
            CloudResourceId = prior.CloudResourceId,
            Title = prior.Title,
            Severity = prior.Severity,
            RiskScore = prior.RiskScore,
            Exploitability = prior.Exploitability,
            Exposure = prior.Exposure,
            BusinessCriticality = prior.BusinessCriticality,
            BlastRadius = prior.BlastRadius,
            PathId = prior.PathId,
            LastObservedUtc = prior.LastObservedUtc,
            UpdatedUtc = prior.UpdatedUtc,
            PayloadHashSha256 = prior.PayloadHashSha256,
            Status = OperationalSecurityFindingStatus.Closed,
        }.ApplyTo(prior);

        var result = await sut.IngestBatchAsync(scope,
            [CreateAliasedAdvisory("msrc", "MSRC-111", first.AddDays(1)) with { Severity = severity }], "service@test");

        result.DeduplicatedCount.Should().Be(deduplicated ? 1 : 0);
        result.IngestedCount.Should().Be(deduplicated ? 0 : 1);
        repository.StoredObservations.Should().HaveCount(deduplicated ? 1 : 2);
        OperationalSecurityFindingRecord current = repository.StoredFindings.Should().ContainSingle().Which;
        current.Status.Should().Be(deduplicated ? OperationalSecurityFindingStatus.Closed : OperationalSecurityFindingStatus.Recurred);
        current.Severity.Should().Be(severity ?? prior.Severity);
        current.RiskScore.Should().Be(prior.RiskScore);
        current.PathId.Should().Be(pathId);
    }

    private static OperationalSecurityFindingIngestItem CreateAliasedAdvisory(
        string source, string id, DateTime observedUtc, bool referenceOnly = false, bool providerFixed = false) =>
        new()
        {
            Provider = CloudProvider.Azure,
            SourceSystem = source,
            SourceFindingId = id,
            CloudResourceId = ProjectId,
            ObservedUtc = observedUtc,
            Title = "Runtime advisory",
            Severity = "critical",
            Metadata = new Dictionary<string, string?>
            {
                [AdvisoryRemediationEvidence.MetadataKey] = System.Text.Json.JsonSerializer.Serialize(new
                {
                    advisoryId = id,
                    sourceUrl = "https://example.com/" + id,
                    owner = providerFixed ? "Provider" : "Customer",
                    providerFix = providerFixed ? "Fixed" : "NotApplicable",
                    customerAction = providerFixed ? "NotRequired" : "Required",
                }),
                ["securenow.advisory-alias.v1"] = System.Text.Json.JsonSerializer.Serialize(new
                {
                    cveId = " cVe-2026-12345 ",
                    targetKey = "runtime/app",
                    revision = observedUtc.ToString("O"),
                    referenceOnly,
                    defenderRecommendationId = "defender-recommendation",
                    crosswalkVersion = "2026.1",
                }),
            },
        };

    private static OperationalSecurityFindingIngestItem CreateItem(string sourceSystem, string sourceFindingId) =>
        new()
        {
            Provider = CloudProvider.Azure,
            SourceSystem = sourceSystem,
            SourceFindingId = sourceFindingId,
            Title = "Unencrypted disk",
            Severity = "High",
            Status = OperationalSecurityFindingStatus.Open,
        };

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public List<OperationalSecurityFindingObservationRecord> StoredObservations { get; } = [];

        public List<OperationalSecurityFindingMetadataRecord> StoredMetadata { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId
                && finding.Provider == provider
                && finding.SourceSystem == sourceSystem
                && finding.SourceFindingId == sourceFindingId);

            return Task.FromResult(match);
        }

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId && finding.FindingId == findingId);

            return Task.FromResult(match);
        }

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default)
        {
            IEnumerable<OperationalSecurityFindingRecord> query = StoredFindings.Where(finding => finding.TenantId == tenantId);

            if (status.HasValue)
                query = query.Where(finding => finding.Status == status.Value);

            return Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(query.ToList());
        }

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>(
                StoredMetadata
                    .Where(row => row.TenantId == tenantId && row.FindingId == findingId)
                    .ToList());

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>(
                StoredObservations
                    .Where(row => row.TenantId == tenantId && row.FindingId == findingId)
                    .ToList());

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
        {
            StoredFindings.Add(finding);
            StoredMetadata.AddRange(metadata);
            StoredObservations.Add(observation);
            return Task.CompletedTask;
        }

        public Task AppendAdvisorySourceInScopeAsync(
            ProjectScopeKey scope, Guid findingId, string key, string value,
            CancellationToken cancellationToken = default)
        {
            if (StoredFindings.Any(row => row.FindingId == findingId && scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId))
                && !StoredMetadata.Any(row => row.FindingId == findingId && row.MetadataKey == key))
            {
                StoredMetadata.Add(new OperationalSecurityFindingMetadataRecord
                {
                    MetadataRowId = Guid.NewGuid(), FindingId = findingId, TenantId = scope.TenantId,
                    MetadataKey = key, MetadataValue = value,
                });
            }
            return Task.CompletedTask;
        }

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
        {
            int index = StoredFindings.FindIndex(row => row.FindingId == finding.FindingId);

            if (index >= 0)
                StoredFindings[index] = finding;

            foreach (OperationalSecurityFindingMetadataRecord row in metadata)
            {
                int metadataIndex = StoredMetadata.FindIndex(candidate =>
                    candidate.TenantId == row.TenantId
                    && candidate.FindingId == row.FindingId
                    && candidate.MetadataKey == row.MetadataKey);

                if (metadataIndex >= 0)
                    StoredMetadata[metadataIndex] = row;
                else
                    StoredMetadata.Add(row);
            }

            if (observation is not null)
                StoredObservations.Add(observation);

            return Task.CompletedTask;
        }
    }
}
