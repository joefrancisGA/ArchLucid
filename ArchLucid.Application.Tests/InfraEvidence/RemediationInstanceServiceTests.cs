using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationInstanceServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid FindingId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid PatternId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid VersionId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    private static readonly Guid SnapshotA = Guid.Parse("77777777-7777-7777-7777-777777777777");
    private static readonly Guid SnapshotB = Guid.Parse("88888888-8888-8888-8888-888888888888");
    private static readonly Guid CloudResourceId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    [Fact]
    public async Task CreateFromMatch_rejects_non_approved_pattern()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch);

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(RemediationPatternStatus.Draft));

        RemediationInstanceService sut = CreateSut(instanceRepository, matchRepository, patternRepository);

        RemediationInstanceOperationResult result =
            await sut.CreateFromMatchAsync(CreateScope(), FindingId, "creator");

        result.Succeeded.Should().BeFalse();
        result.Blockers.Should().ContainSingle(blocker => blocker.Contains("Approved"));
    }

    [Fact]
    public async Task CreateFromMatch_blocks_conflict_match()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.Conflict);

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            matchRepository,
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult result =
            await sut.CreateFromMatchAsync(CreateScope(), FindingId, "creator");

        result.Succeeded.Should().BeFalse();
        result.Blockers.Should().ContainSingle(blocker => blocker.Contains("conflict", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Execute_does_not_set_verified_status()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(instanceId, RemediationInstanceStatus.WaveAssigned));

        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch);

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(RemediationPatternStatus.Approved, RemediationAutomationLevel.Guided));

        InMemorySnapshotRepository snapshotRepository = new();

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            matchRepository,
            patternRepository,
            exceptionRepository: new InMemoryOperationalSecurityExceptionRepository { HasActiveException = true },
            snapshotRepository: snapshotRepository);

        RemediationInstanceOperationResult result = await sut.ExecuteAsync(
            CreateScope(),
            instanceId,
            SnapshotA,
            "executor",
            "corr-1");

        result.Succeeded.Should().BeTrue();
        result.Status.Should().Be(RemediationInstanceStatus.Executed);
        result.Status.Should().NotBe(RemediationInstanceStatus.Verified);

        instanceRepository.Instances.Single().Status.Should().Be(RemediationInstanceStatus.Executed);
        instanceRepository.Evidence.Should().Contain(evidence => evidence.Phase == RemediationEvidencePhase.ExecuteResult);
    }

    [Fact]
    public async Task AttestChangeImplemented_succeeds_from_executed_and_records_timestamp()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(instanceId, RemediationInstanceStatus.Executed));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult result = await sut.AttestChangeImplementedAsync(
            CreateScope(),
            instanceId,
            "attestor");

        result.Succeeded.Should().BeTrue();
        result.Status.Should().Be(RemediationInstanceStatus.ChangeImplemented);
        instanceRepository.Instances.Single().Status.Should().Be(RemediationInstanceStatus.ChangeImplemented);
        instanceRepository.Instances.Single().ChangeImplementedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task AttestChangeImplemented_requires_actor_key()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(instanceId, RemediationInstanceStatus.Executed));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult result = await sut.AttestChangeImplementedAsync(
            CreateScope(),
            instanceId,
            " ");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("ActorKey is required.");
        instanceRepository.Instances.Single().Status.Should().Be(RemediationInstanceStatus.Executed);
    }

    [Fact]
    public async Task Verify_from_executed_fails_before_loading_snapshots()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.Executed,
            executionSnapshotId: SnapshotA));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult result = await sut.VerifyAsync(
            CreateScope(),
            instanceId,
            SnapshotB,
            "verifier");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Only change-implemented instances may be verified.");
    }

    [Fact]
    public void Guard_does_not_allow_executed_to_verify_or_fail()
    {
        RemediationInstanceGuard.CanTransition(
            RemediationInstanceStatus.Executed,
            RemediationInstanceStatus.Verified,
            out _).Should().BeFalse();
        RemediationInstanceGuard.CanTransition(
            RemediationInstanceStatus.Executed,
            RemediationInstanceStatus.VerificationFailed,
            out _).Should().BeFalse();
    }

    [Fact]
    public async Task Verify_fails_when_verification_snapshot_is_not_later_than_attestation()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.ChangeImplemented,
            executionSnapshotId: SnapshotA,
            changeImplementedUtc: new DateTime(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc),
            cloudResourceId: CloudResourceId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(
            RemediationPatternStatus.Approved,
            RemediationAutomationLevel.Guided));

        InMemorySnapshotRepository snapshotRepository = new();
        snapshotRepository.Snapshots[SnapshotA] = CreateSnapshot(
            SnapshotA,
            Guid.NewGuid(),
            present: true,
            capturedUtc: new DateTime(2026, 9, 27, 12, 0, 0, DateTimeKind.Utc));
        snapshotRepository.Snapshots[SnapshotB] = CreateSnapshot(
            SnapshotB,
            Guid.NewGuid(),
            present: true,
            capturedUtc: new DateTime(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            patternRepository,
            snapshotRepository: snapshotRepository);

        RemediationInstanceOperationResult result = await sut.VerifyAsync(
            CreateScope(),
            instanceId,
            SnapshotB,
            "verifier");

        result.Succeeded.Should().BeFalse();
        result.Blockers.Should().ContainSingle(blocker =>
            blocker.Contains("strictly later than the change implementation attestation"));
    }

    [Theory]
    [InlineData("observed")]
    [InlineData("redacted")]
    [InlineData("missing")]
    public async Task Verify_with_later_snapshot_requires_collected_property_evidence(string evidenceState)
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();

        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.ChangeImplemented,
            executionSnapshotId: SnapshotA,
            changeImplementedUtc: new DateTime(2026, 9, 27, 12, 0, 30, DateTimeKind.Utc),
            cloudResourceId: CloudResourceId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(
            RemediationPatternStatus.Approved,
            RemediationAutomationLevel.Guided,
            content: new RemediationPatternVersionContent
            {
                ControlObjective = "Restrict inbound",
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries =
                    [
                        "snapshot.resource.present",
                        "property:enablePublicNetworkAccess=false",
                    ],
                },
                Rollback = new RemediationPatternRollbackDefinition { RunbookRef = "rb-1" },
            }));

        InMemorySnapshotRepository snapshotRepository = new();
        snapshotRepository.Snapshots[SnapshotA] = CreateSnapshot(
            SnapshotA,
            resourceRowId,
            present: true,
            capturedUtc: new DateTime(2026, 9, 27, 12, 0, 0, DateTimeKind.Utc));
        snapshotRepository.Snapshots[SnapshotB] = CreateSnapshot(
            SnapshotB,
            resourceRowId,
            present: true,
            includeDisabledPublicAccess: evidenceState != "missing",
            capturedUtc: new DateTime(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc));

        if (evidenceState == "redacted")
        {
            AzureInventorySnapshotDetailReadModel original = snapshotRepository.Snapshots[SnapshotB];
            snapshotRepository.Snapshots[SnapshotB] = new AzureInventorySnapshotDetailReadModel
            {
                Header = original.Header,
                Resources = original.Resources,
                Properties = [new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = resourceRowId,
                    PropertyKey = "enablePublicNetworkAccess",
                    PropertyValue = "false",
                    IsRedacted = true,
                }],
            };
        }

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository { ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch) },
            patternRepository,
            snapshotRepository: snapshotRepository);

        RemediationInstanceOperationResult verifyResult = await sut.VerifyAsync(
            CreateScope(),
            instanceId,
            SnapshotB,
            "verifier");

        if (evidenceState != "observed")
        {
            verifyResult.Succeeded.Should().BeFalse();
            verifyResult.Blockers.Should().Contain(blocker => blocker.StartsWith("Insufficient evidence:", StringComparison.Ordinal));
            RemediationInstanceRecord persisted = instanceRepository.Instances.Single(instance => instance.InstanceId == instanceId);
            persisted.Status.Should().Be(RemediationInstanceStatus.VerificationFailed);
            persisted.VerificationResultJson.Should().Contain("Insufficient evidence:");
            (await sut.CloseAsync(CreateScope(), instanceId, "closer")).Succeeded.Should().BeFalse();
            return;
        }

        verifyResult.Succeeded.Should().BeTrue();
        verifyResult.Status.Should().Be(RemediationInstanceStatus.Verified);

        RemediationInstanceOperationResult closeResult = await sut.CloseAsync(CreateScope(), instanceId, "closer");

        closeResult.Succeeded.Should().BeTrue();
        closeResult.Status.Should().Be(RemediationInstanceStatus.Closed);
    }

    [Fact]
    public async Task Verify_fails_when_execution_snapshot_cannot_be_loaded()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.ChangeImplemented,
            executionSnapshotId: SnapshotA,
            changeImplementedUtc: new DateTime(2026, 9, 27, 12, 0, 30, DateTimeKind.Utc),
            cloudResourceId: CloudResourceId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(
            RemediationPatternStatus.Approved,
            RemediationAutomationLevel.Guided));

        InMemorySnapshotRepository snapshotRepository = new();
        snapshotRepository.Snapshots[SnapshotB] = CreateSnapshot(
            SnapshotB,
            Guid.NewGuid(),
            present: true,
            capturedUtc: new DateTime(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            patternRepository,
            snapshotRepository: snapshotRepository);

        RemediationInstanceOperationResult result = await sut.VerifyAsync(
            CreateScope(),
            instanceId,
            SnapshotB,
            "verifier");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Execution inventory snapshot was not found.");
        instanceRepository.Evidence.Should().BeEmpty();
        instanceRepository.Instances.Single().Status.Should().Be(RemediationInstanceStatus.ChangeImplemented);
    }

    [Fact]
    public async Task CreateFromMatch_without_path_id_does_not_set_narrative()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch);

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(RemediationPatternStatus.Approved));

        Mock<IOperationalSecurityFindingRepository> findingRepository = new();
        findingRepository
            .Setup(repository => repository.TryGetByIdInScopeAsync(
                ProjectScopeKey.Create(TenantId, WorkspaceId, ProjectId),
                FindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateOperationalFinding(pathId: null));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            matchRepository,
            patternRepository,
            findingRepository: findingRepository.Object);

        RemediationInstanceOperationResult result =
            await sut.CreateFromMatchAsync(CreateScope(), FindingId, "creator");

        result.Succeeded.Should().BeTrue();
        RemediationInstanceRecord instance = instanceRepository.Instances.Single();
        instance.PathId.Should().BeNull();
        instance.PathNarrativeJson.Should().BeNull();
    }

    [Fact]
    public async Task CreateFromMatch_with_path_id_persists_structured_narrative()
    {
        Guid pathId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        InMemoryRemediationInstanceRepository instanceRepository = new();
        InMemoryRemediationPatternMatchRepository matchRepository = new();
        matchRepository.ActiveMatch = CreateMatch(RemediationPatternMatchKind.ExactMatch);

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(RemediationPatternStatus.Approved));

        Mock<IOperationalSecurityFindingRepository> findingRepository = new();
        findingRepository
            .Setup(repository => repository.TryGetByIdInScopeAsync(
                ProjectScopeKey.Create(TenantId, WorkspaceId, ProjectId),
                FindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateOperationalFinding(pathId: pathId));

        RemediationPathNarrative expectedNarrative = new()
        {
            PathId = pathId,
            PathKind = PathKind.IntendedReachability.ToString(),
            PathConfidenceBand = PathConfidenceBand.HighlyLikely.ToString(),
            ProblemStatement = "Intended reachability path breaks isolation.",
            WhyItMatters = "Highly likely path.",
            ExposureSummary = "Exposure summary.",
            AffectedDependencyCloudResourceIds = [CloudResourceId],
            RecommendedChange = "Disable public access.",
            BlastRadiusWarning = $"CloudResourceIds: {CloudResourceId:D}",
            SafeRolloutSteps = ["Create private endpoint"],
            VerificationQueries = ["property:enablePublicNetworkAccess=false"],
            WeakestHopReason = "Public access enabled.",
            CanonicalHopHashHex = Convert.ToHexStringLower(Enumerable.Repeat((byte)0x11, 32).ToArray()),
        };

        Mock<IRemediationPathNarrativeBuilder> narrativeBuilder = new();
        narrativeBuilder
            .Setup(builder => builder.TryBuildAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<OperationalSecurityFindingRecord>(),
                It.IsAny<RemediationPatternVersionRecord>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedNarrative);

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            matchRepository,
            patternRepository,
            findingRepository: findingRepository.Object,
            pathNarrativeBuilder: narrativeBuilder.Object);

        RemediationInstanceOperationResult result =
            await sut.CreateFromMatchAsync(CreateScope(), FindingId, "creator");

        result.Succeeded.Should().BeTrue();

        RemediationInstanceRecord instance = instanceRepository.Instances.Single();
        instance.PathId.Should().Be(pathId);
        instance.PathNarrativeJson.Should().NotBeNullOrWhiteSpace();

        RemediationPathNarrative? persisted =
            RemediationPathNarrativeJson.TryDeserialize(instance.PathNarrativeJson);

        persisted.Should().NotBeNull();
        persisted!.ProblemStatement.Should().Be(expectedNarrative.ProblemStatement);
        persisted.BlastRadiusWarning.Should().Contain(CloudResourceId.ToString("D"));
        persisted.VerificationQueries.Should().Contain("property:enablePublicNetworkAccess=false");
    }

    [Fact]
    public void Remediation_instance_service_source_has_no_cloud_apply_commands()
    {
        string source = File.ReadAllText(
            Path.Combine(
                AppContext.BaseDirectory,
                "..",
                "..",
                "..",
                "..",
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceService.cs"));

        string normalized = source.Replace(" ", string.Empty, StringComparison.Ordinal);
        normalized.Should().NotContain("terraformapply", "execute must not invoke terraform apply");
        normalized.Should().NotContain("arm.Put", "execute must not invoke ARM PUT");
        normalized.Should().NotContain("arm.Patch", "execute must not invoke ARM PATCH");
        normalized.Should().NotContain("arm.Delete", "execute must not invoke ARM DELETE");
    }

    [Fact]
    public async Task ApproveAsync_foreign_project_instance_returns_not_found()
    {
        InMemoryRemediationInstanceRepository instanceRepository = new();
        Guid instanceId = Guid.NewGuid();
        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.PreflightPassed,
            projectId: Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")));

        RemediationInstanceService sut = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult result =
            await sut.ApproveAsync(CreateScope(), instanceId, "approver");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Remediation instance was not found.");
        instanceRepository.Instances.Single().Status.Should().Be(RemediationInstanceStatus.PreflightPassed);
    }

    [Theory]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    public async Task ApproveAsync_rejects_cross_scope_instance_without_mutating_owner_record(string foreignDimension)
    {
        InMemoryRemediationInstanceRepository instances = new();
        Guid instanceId = Guid.NewGuid();
        instances.Instances.Add(CreateInstance(instanceId, RemediationInstanceStatus.PreflightPassed));

        ScopeContext foreignScope = new()
        {
            TenantId = foreignDimension == "tenant" ? Guid.NewGuid() : TenantId,
            WorkspaceId = foreignDimension == "workspace" ? Guid.NewGuid() : WorkspaceId,
            ProjectId = foreignDimension == "project" ? Guid.NewGuid() : ProjectId,
        };

        RemediationInstanceService service = CreateSut(
            instances,
            new InMemoryRemediationPatternMatchRepository(),
            new InMemoryRemediationPatternRepository());

        RemediationInstanceOperationResult denied =
            await service.ApproveAsync(foreignScope, instanceId, "approver");

        denied.Succeeded.Should().BeFalse();
        denied.ErrorMessage.Should().Be("Remediation instance was not found.");
        instances.Instances.Should().ContainSingle();
        instances.Instances[0].Status.Should().Be(RemediationInstanceStatus.PreflightPassed);
    }

    [Fact]
    public async Task Passing_verify_with_control_and_snapshot_writes_one_association_and_detail_lists_it()
    {
        Guid controlId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        Guid assessmentId = Guid.Parse("cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd");
        PassingVerifyHarness harness = ArrangePassingVerify(controlId, assessmentId);

        RemediationInstanceOperationResult result = await harness.Service.VerifyAsync(
            CreateScope(),
            harness.InstanceId,
            SnapshotB,
            "verifier");

        result.Succeeded.Should().BeTrue();
        result.Status.Should().Be(RemediationInstanceStatus.Verified);

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await harness.Associations.ListByInstanceAsync(CreateScope().ToProjectScopeKey(), harness.InstanceId);

        rows.Should().ContainSingle();
        rows[0].InstanceId.Should().Be(harness.InstanceId);
        rows[0].VerificationSnapshotId.Should().Be(SnapshotB);
        rows[0].ControlId.Should().Be(controlId);
        rows[0].AssessmentId.Should().Be(assessmentId);

        RemediationInstanceDetail? detail = await CreateQuery(harness).TryGetInstanceAsync(CreateScope(), harness.InstanceId);

        detail.Should().NotBeNull();
        detail!.VerifiedRemediationAssociations.Should().ContainSingle();
        VerifiedRemediationAssociationIdentifier listed = detail.VerifiedRemediationAssociations[0];
        listed.AssociationId.Should().Be(rows[0].AssociationId);
        listed.InstanceId.Should().Be(harness.InstanceId);
        listed.VerificationSnapshotId.Should().Be(SnapshotB);
        listed.ControlId.Should().Be(controlId);
        listed.AssessmentId.Should().Be(assessmentId);
        listed.CreatedUtc.Should().Be(rows[0].CreatedUtc);
        listed.UpdatedUtc.Should().Be(rows[0].UpdatedUtc);
    }

    [Fact]
    public async Task Passing_verify_again_for_the_same_snapshot_and_control_updates_the_existing_row()
    {
        Guid controlId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        PassingVerifyHarness harness = ArrangePassingVerify(controlId, assessmentId: null);

        await harness.Service.VerifyAsync(CreateScope(), harness.InstanceId, SnapshotB, "verifier");
        VerifiedRemediationControlAssociationRecord first = (await harness.Associations.ListByInstanceAsync(
            CreateScope().ToProjectScopeKey(),
            harness.InstanceId)).Single();

        await ReopenForVerificationAsync(harness.Instances, harness.InstanceId);

        RemediationInstanceOperationResult second = await harness.Service.VerifyAsync(
            CreateScope(),
            harness.InstanceId,
            SnapshotB,
            "verifier");

        second.Succeeded.Should().BeTrue();

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await harness.Associations.ListByInstanceAsync(CreateScope().ToProjectScopeKey(), harness.InstanceId);

        rows.Should().ContainSingle();
        rows[0].AssociationId.Should().Be(first.AssociationId);
        rows[0].CreatedUtc.Should().Be(first.CreatedUtc);
        rows[0].UpdatedUtc.Should().BeOnOrAfter(first.UpdatedUtc);
    }

    [Fact]
    public async Task Passing_verify_with_a_new_snapshot_inserts_a_second_association()
    {
        Guid controlId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        Guid laterSnapshotId = Guid.Parse("12121212-1212-1212-1212-121212121212");
        PassingVerifyHarness harness = ArrangePassingVerify(controlId, assessmentId: null);
        AddPassingSnapshot(
            harness.Snapshots,
            laterSnapshotId,
            harness.ResourceRowId,
            new DateTime(2026, 9, 27, 12, 2, 0, DateTimeKind.Utc));

        await harness.Service.VerifyAsync(CreateScope(), harness.InstanceId, SnapshotB, "verifier");
        await ReopenForVerificationAsync(harness.Instances, harness.InstanceId);

        RemediationInstanceOperationResult second = await harness.Service.VerifyAsync(
            CreateScope(),
            harness.InstanceId,
            laterSnapshotId,
            "verifier");

        second.Succeeded.Should().BeTrue();

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await harness.Associations.ListByInstanceAsync(CreateScope().ToProjectScopeKey(), harness.InstanceId);

        rows.Should().HaveCount(2);
        rows.Select(row => row.VerificationSnapshotId).Should().BeEquivalentTo([SnapshotB, laterSnapshotId]);
    }

    [Fact]
    public async Task Passing_verify_with_null_control_id_succeeds_and_writes_no_row() =>
        await AssertMissingControlWritesNoRowAsync(null);

    [Fact]
    public async Task Passing_verify_with_empty_control_id_succeeds_and_writes_no_row() =>
        await AssertMissingControlWritesNoRowAsync(Guid.Empty);

    [Fact]
    public async Task Failed_verify_writes_no_row_and_leaves_an_older_association()
    {
        Guid controlId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        Guid failingSnapshotId = Guid.Parse("13131313-1313-1313-1313-131313131313");
        PassingVerifyHarness harness = ArrangePassingVerify(controlId, assessmentId: null);
        AddSnapshot(
            harness.Snapshots,
            failingSnapshotId,
            harness.ResourceRowId,
            present: true,
            includeDisabledPublicAccess: false,
            capturedUtc: new DateTime(2026, 9, 27, 12, 3, 0, DateTimeKind.Utc));

        await harness.Service.VerifyAsync(CreateScope(), harness.InstanceId, SnapshotB, "verifier");
        VerifiedRemediationControlAssociationRecord original = (await harness.Associations.ListByInstanceAsync(
            CreateScope().ToProjectScopeKey(),
            harness.InstanceId)).Single();

        await ReopenForVerificationAsync(harness.Instances, harness.InstanceId);

        RemediationInstanceOperationResult failed = await harness.Service.VerifyAsync(
            CreateScope(),
            harness.InstanceId,
            failingSnapshotId,
            "verifier");

        failed.Succeeded.Should().BeFalse();
        harness.Instances.Instances.Single().Status.Should().Be(RemediationInstanceStatus.VerificationFailed);

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await harness.Associations.ListByInstanceAsync(CreateScope().ToProjectScopeKey(), harness.InstanceId);

        rows.Should().ContainSingle();
        rows[0].AssociationId.Should().Be(original.AssociationId);
        rows[0].VerificationSnapshotId.Should().Be(SnapshotB);
    }

    [Fact]
    public async Task Another_tenants_detail_does_not_include_the_association()
    {
        Guid controlId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        PassingVerifyHarness harness = ArrangePassingVerify(controlId, assessmentId: null);
        await harness.Service.VerifyAsync(CreateScope(), harness.InstanceId, SnapshotB, "verifier");
        VerifiedRemediationControlAssociationRecord ownerRow = (await harness.Associations.ListByInstanceAsync(
            CreateScope().ToProjectScopeKey(),
            harness.InstanceId)).Single();

        Guid otherTenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab");
        await harness.Associations.UpsertAsync(
            ProjectScopeKey.Create(otherTenantId, WorkspaceId, ProjectId),
            new VerifiedRemediationControlAssociationRecord
            {
                AssociationId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc"),
                TenantId = otherTenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                InstanceId = harness.InstanceId,
                VerificationSnapshotId = SnapshotB,
                ControlId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccd"),
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            });

        RemediationInstanceQueryService query = CreateQuery(harness);
        RemediationInstanceDetail? otherDetail = await query.TryGetInstanceAsync(
            new ScopeContext
            {
                TenantId = otherTenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
            },
            harness.InstanceId);

        otherDetail.Should().BeNull();

        RemediationInstanceDetail? ownerDetail = await query.TryGetInstanceAsync(CreateScope(), harness.InstanceId);
        ownerDetail.Should().NotBeNull();
        ownerDetail!.VerifiedRemediationAssociations.Should().ContainSingle();
        ownerDetail.VerifiedRemediationAssociations[0].AssociationId.Should().Be(ownerRow.AssociationId);
    }

    [Fact]
    public async Task Passing_verify_restores_the_instance_when_the_association_upsert_fails()
    {
        Guid controlId = Guid.Parse("abababab-abab-abab-abab-abababababab");
        PassingVerifyHarness harness = ArrangePassingVerify(
            controlId,
            assessmentId: null,
            associations: new ThrowingAssociationRepository());

        RemediationInstanceOperationResult result = await harness.Service.VerifyAsync(
            CreateScope(),
            harness.InstanceId,
            SnapshotB,
            "verifier");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Verified remediation association could not be saved.");
        harness.Instances.Instances.Single().Status.Should().Be(RemediationInstanceStatus.ChangeImplemented);
        harness.Instances.Instances.Single().VerificationSnapshotId.Should().BeNull();
    }

    private static async Task AssertMissingControlWritesNoRowAsync(Guid? controlId)
    {
        PassingVerifyHarness harness = ArrangePassingVerify(controlId, assessmentId: null);

        RemediationInstanceOperationResult result = await harness.Service.VerifyAsync(
            CreateScope(),
            harness.InstanceId,
            SnapshotB,
            "verifier");

        result.Succeeded.Should().BeTrue();
        result.Status.Should().Be(RemediationInstanceStatus.Verified);

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await harness.Associations.ListByInstanceAsync(CreateScope().ToProjectScopeKey(), harness.InstanceId);

        rows.Should().BeEmpty();

        RemediationInstanceDetail? detail = await CreateQuery(harness).TryGetInstanceAsync(CreateScope(), harness.InstanceId);
        detail.Should().NotBeNull();
        detail!.VerifiedRemediationAssociations.Should().BeEmpty();
    }

    private static PassingVerifyHarness ArrangePassingVerify(
        Guid? controlId,
        Guid? assessmentId,
        IVerifiedRemediationControlAssociationRepository? associations = null)
    {
        Guid instanceId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();
        InMemoryRemediationInstanceRepository instanceRepository = new();
        instanceRepository.Instances.Add(CreateInstance(
            instanceId,
            RemediationInstanceStatus.ChangeImplemented,
            executionSnapshotId: SnapshotA,
            changeImplementedUtc: new DateTime(2026, 9, 27, 12, 0, 30, DateTimeKind.Utc),
            cloudResourceId: CloudResourceId,
            controlId: controlId,
            assessmentId: assessmentId));

        InMemoryRemediationPatternRepository patternRepository = new();
        patternRepository.Versions.Add(CreateVersion(
            RemediationPatternStatus.Approved,
            RemediationAutomationLevel.Guided,
            content: new RemediationPatternVersionContent
            {
                ControlObjective = "Restrict inbound",
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries =
                    [
                        "snapshot.resource.present",
                        "property:enablePublicNetworkAccess=false",
                    ],
                },
                Rollback = new RemediationPatternRollbackDefinition { RunbookRef = "rb-1" },
            }));

        InMemorySnapshotRepository snapshotRepository = new();
        AddSnapshot(
            snapshotRepository,
            SnapshotA,
            resourceRowId,
            present: true,
            includeDisabledPublicAccess: false,
            capturedUtc: new DateTime(2026, 9, 27, 12, 0, 0, DateTimeKind.Utc));
        AddPassingSnapshot(
            snapshotRepository,
            SnapshotB,
            resourceRowId,
            new DateTime(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc));

        InMemoryVerifiedRemediationControlAssociationRepository storedAssociations = new();
        IVerifiedRemediationControlAssociationRepository associationRepository = associations ?? storedAssociations;

        RemediationInstanceService service = CreateSut(
            instanceRepository,
            new InMemoryRemediationPatternMatchRepository(),
            patternRepository,
            snapshotRepository: snapshotRepository,
            associationRepository: associationRepository);

        return new PassingVerifyHarness
        {
            Instances = instanceRepository,
            Snapshots = snapshotRepository,
            Associations = storedAssociations,
            Service = service,
            InstanceId = instanceId,
            ResourceRowId = resourceRowId,
        };
    }

    private static void AddPassingSnapshot(
        InMemorySnapshotRepository snapshots,
        Guid snapshotId,
        Guid resourceRowId,
        DateTime capturedUtc) =>
        AddSnapshot(
            snapshots,
            snapshotId,
            resourceRowId,
            present: true,
            includeDisabledPublicAccess: true,
            capturedUtc: capturedUtc);

    private static void AddSnapshot(
        InMemorySnapshotRepository snapshots,
        Guid snapshotId,
        Guid resourceRowId,
        bool present,
        bool includeDisabledPublicAccess,
        DateTime capturedUtc)
    {
        ArgumentNullException.ThrowIfNull(snapshots);
        snapshots.Snapshots[snapshotId] = CreateSnapshot(
            snapshotId,
            resourceRowId,
            present,
            includeDisabledPublicAccess,
            capturedUtc);
    }

    private static async Task ReopenForVerificationAsync(
        InMemoryRemediationInstanceRepository repository,
        Guid instanceId)
    {
        ArgumentNullException.ThrowIfNull(repository);

        // VerifyAsync accepts only ChangeImplemented. A later pass puts that status back; it does not add a transition.
        RemediationInstanceRecord current = repository.Instances.Single(row => row.InstanceId == instanceId);
        await ((IRemediationInstanceRepository)repository).UpdateInstanceInScopeAsync(
            CreateScope().ToProjectScopeKey(),
            new RemediationInstanceMutation
            {
                InstanceId = current.InstanceId,
                Status = RemediationInstanceStatus.ChangeImplemented,
                CloudResourceId = current.CloudResourceId,
                PathId = current.PathId,
                PathNarrativeJson = current.PathNarrativeJson,
                AssessmentId = current.AssessmentId,
                ControlId = current.ControlId,
                PreflightSnapshotId = current.PreflightSnapshotId,
                ExecutionSnapshotId = current.ExecutionSnapshotId,
                VerificationSnapshotId = current.VerificationSnapshotId,
                WaveId = current.WaveId,
                PreflightResultJson = current.PreflightResultJson,
                VerificationResultJson = current.VerificationResultJson,
                ApprovedByActorKey = current.ApprovedByActorKey,
                UpdatedUtc = current.UpdatedUtc,
                ApprovedUtc = current.ApprovedUtc,
                ExecutedUtc = current.ExecutedUtc,
                ChangeImplementedUtc = current.ChangeImplementedUtc,
                VerifiedUtc = current.VerifiedUtc,
                ClosedUtc = current.ClosedUtc,
            });
    }

    private static RemediationInstanceQueryService CreateQuery(PassingVerifyHarness harness)
    {
        ArgumentNullException.ThrowIfNull(harness);

        return new RemediationInstanceQueryService(
            new ProjectScopedRemediationInstanceRepositoryAdapter(harness.Instances),
            new ProjectScopedOperationalSecurityFindingRepositoryAdapter(Mock.Of<IOperationalSecurityFindingRepository>()),
            Mock.Of<IRemediationPatternMatchRepository>(),
            Mock.Of<IAuditManualEvidenceRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            harness.Associations);
    }

    private static RemediationInstanceService CreateSut(
        InMemoryRemediationInstanceRepository instanceRepository,
        InMemoryRemediationPatternMatchRepository matchRepository,
        InMemoryRemediationPatternRepository patternRepository,
        InMemoryOperationalSecurityExceptionRepository? exceptionRepository = null,
        InMemorySnapshotRepository? snapshotRepository = null,
        IOperationalSecurityFindingRepository? findingRepository = null,
        IRemediationPathNarrativeBuilder? pathNarrativeBuilder = null,
        ISecurityEvidencePathRepository? pathRepository = null,
        IVerifiedRemediationControlAssociationRepository? associationRepository = null) =>
        new(
            new ProjectScopedRemediationInstanceRepositoryAdapter(instanceRepository),
            matchRepository,
            patternRepository,
            exceptionRepository ?? new InMemoryOperationalSecurityExceptionRepository(),
            snapshotRepository ?? new InMemorySnapshotRepository(),
            Mock.Of<IAdvisoryTerraformRepresentationService>(),
            Mock.Of<IAuditService>(),
            new ProjectScopedOperationalSecurityFindingRepositoryAdapter(
                findingRepository ?? Mock.Of<IOperationalSecurityFindingRepository>()),
            pathNarrativeBuilder ?? Mock.Of<IRemediationPathNarrativeBuilder>(),
            pathRepository ?? Mock.Of<ISecurityEvidencePathRepository>(),
            Mock.Of<IAuditManualEvidenceRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            associationRepository ?? new InMemoryVerifiedRemediationControlAssociationRepository());

    private static ScopeContext CreateScope() =>
        new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

    private static RemediationPatternMatchResultRecord CreateMatch(RemediationPatternMatchKind kind) =>
        new()
        {
            MatchResultId = Guid.NewGuid(),
            TenantId = TenantId,
            FindingId = FindingId,
            PatternId = PatternId,
            VersionId = VersionId,
            PatternKey = "network.nsg-deny",
            PatternVersion = "1.0.0",
            MatchKind = kind,
            MatchSource = RemediationPatternMatchSource.Deterministic,
            ExplainText = "matched",
            IsActive = true,
            MatchedUtc = DateTime.UtcNow,
        };

    private static RemediationPatternVersionRecord CreateVersion(
        RemediationPatternStatus status,
        RemediationAutomationLevel automation = RemediationAutomationLevel.Guided,
        RemediationPatternVersionContent? content = null) =>
        new()
        {
            VersionId = VersionId,
            PatternId = PatternId,
            TenantId = TenantId,
            Version = "1.0.0",
            Status = status,
            ControlObjective = "Restrict inbound",
            ContentJson = JsonSerializer.Serialize(content ?? new RemediationPatternVersionContent
            {
                ControlObjective = "Restrict inbound",
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = ["snapshot.resource.present"],
                },
                Rollback = new RemediationPatternRollbackDefinition { RunbookRef = "rb-rollback" },
            }),
            AutomationLevel = automation,
            AuthorActorKey = "author",
            ApprovedByActorKey = "approver",
            ApprovedUtc = DateTime.UtcNow,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static OperationalSecurityFindingRecord CreateOperationalFinding(Guid? pathId) =>
        new()
        {
            FindingId = FindingId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Provider = CloudProvider.Azure,
            SourceSystem = "Defender",
            SourceFindingId = FindingId.ToString("N"),
            Title = "Test finding",
            Severity = "High",
            Status = OperationalSecurityFindingStatus.Open,
            FirstObservedUtc = DateTime.UtcNow,
            LastObservedUtc = DateTime.UtcNow,
            PathId = pathId,
            CloudResourceId = CloudResourceId,
            PayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static RemediationInstanceRecord CreateInstance(
        Guid instanceId,
        RemediationInstanceStatus status,
        Guid? executionSnapshotId = null,
        DateTime? changeImplementedUtc = null,
        Guid? cloudResourceId = null,
        Guid? projectId = null,
        Guid? controlId = null,
        Guid? assessmentId = null) =>
        new()
        {
            InstanceId = instanceId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = projectId ?? ProjectId,
            FindingId = FindingId,
            PatternId = PatternId,
            PatternVersionId = VersionId,
            PatternKey = "network.nsg-deny",
            FrozenPatternVersion = "1.0.0",
            AutomationLevel = RemediationAutomationLevel.Guided,
            Status = status,
            CloudResourceId = cloudResourceId,
            AssessmentId = assessmentId,
            ControlId = controlId,
            ExecutionSnapshotId = executionSnapshotId,
            ChangeImplementedUtc = changeImplementedUtc,
            CreatedByActorKey = "creator",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        bool present,
        bool includeDisabledPublicAccess = false,
        DateTime? capturedUtc = null)
    {
        AzureInventoryResourceRecord resource = new()
        {
            ResourceRowId = resourceRowId,
            SnapshotId = snapshotId,
            TenantId = TenantId,
            CloudResourceId = CloudResourceId,
            AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
            ResourceType = "Microsoft.Network/networkSecurityGroups",
            SubscriptionId = "sub",
        };

        List<AzureInventoryResourcePropertyReadModel> properties = [];
        if (present && includeDisabledPublicAccess)
        {
            properties.Add(new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = resourceRowId,
                PropertyKey = "enablePublicNetworkAccess",
                PropertyValue = "false",
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                PackageId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CapturedUtc = capturedUtc,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = present ? [resource] : [],
            Properties = properties,
            Tags = [],
            Relationships = [],
            RoleAssignments = [],
            Diagnostics = [],
        };
    }

    private sealed class InMemoryRemediationInstanceRepository : IRemediationInstanceRepository
    {
        public List<RemediationInstanceRecord> Instances { get; } = [];

        public List<RemediationEvidenceRecord> Evidence { get; } = [];

        public Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
        {
            Instances.Add(instance);
            return Task.CompletedTask;
        }

        public Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
        {
            int index = Instances.FindIndex(row => row.InstanceId == instance.InstanceId);

            if (index >= 0)
                Instances[index] = instance;

            return Task.CompletedTask;
        }

        public Task<RemediationInstanceRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Instances.FirstOrDefault(row => row.TenantId == tenantId && row.InstanceId == instanceId));

        public Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default)
        {
            Evidence.Add(evidence);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
            Guid tenantId,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationEvidenceRecord>>(
                Evidence.Where(row => row.TenantId == tenantId && row.InstanceId == instanceId).ToList());

        public Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationInstanceRecord>>(
                Instances.Where(row => row.TenantId == tenantId).ToList());

        public Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationInstanceRecord>>([]);
    }

    private sealed class InMemoryRemediationPatternMatchRepository : IRemediationPatternMatchRepository
    {
        public RemediationPatternMatchResultRecord? ActiveMatch
        {
            get;
            set;
        }

        public Task DeactivateMatchesForFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertMatchResultAsync(
            RemediationPatternMatchResultRecord matchResult,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertConflictAsync(
            RemediationPatternMatchConflictRecord conflict,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(ActiveMatch);

        public Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListActiveMatchesForOpenFindingsInScopeAsync(
            ProjectScopeKey scope,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchResultRecord>>(
                ActiveMatch is null ? [] : [ActiveMatch]);

        public Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchResultRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternMatchConflictRecord>>([]);
    }

    private sealed class InMemoryRemediationPatternRepository : IRemediationPatternRepository
    {
        public List<RemediationPatternVersionRecord> Versions { get; } = [];

        public Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RemediationPatternRecord?>(null);

        public Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
            Guid tenantId,
            string patternKey,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<RemediationPatternRecord?>(null);

        public Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
            Guid tenantId,
            Guid patternId,
            string version,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Versions.FirstOrDefault(row =>
                row.TenantId == tenantId && row.PatternId == patternId && row.Version == version));

        public Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
            Guid tenantId,
            Guid patternId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternVersionRecord>>([]);

        public Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RemediationPatternApprovedVersionRecord>>([]);
    }

    private sealed class InMemoryOperationalSecurityExceptionRepository : IOperationalSecurityExceptionRepository
    {
        public bool HasActiveException
        {
            get;
            set;
        }

        public Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid exceptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityExceptionRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
            Guid tenantId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
            Guid tenantId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

        public Task MarkExpiryProcessedAsync(
            Guid tenantId,
            Guid exceptionId,
            DateTime processedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RevokeAsync(
            Guid tenantId,
            Guid exceptionId,
            string revokedByActorKey,
            DateTime revokedUtc,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<bool> HasActiveExceptionForFindingAsync(
            Guid tenantId,
            Guid findingId,
            DateTime asOfUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(HasActiveException);
    }

    private sealed class InMemorySnapshotRepository : IAzureInventorySnapshotRepository
    {
        public Dictionary<Guid, AzureInventorySnapshotDetailReadModel> Snapshots { get; } = [];

        public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
            ScopeContext scope,
            Guid packageId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<AzureInventorySnapshotRecord?>(null);

        public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            if (Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot))
                return Task.FromResult<AzureInventorySnapshotRecord?>(snapshot.Header);

            return Task.FromResult<AzureInventorySnapshotRecord?>(null);
        }

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetCanonicalSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot) ? snapshot : null);

        public Task MaterializeSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            AzureInventorySnapshotMaterializeWriteRequest writeRequest,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
            ScopeContext scope,
            string subscriptionId,
            Guid newerSnapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Guid?>(null);

        public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
            ScopeContext scope,
            int page,
            int pageSize,
            string? subscriptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<AzureInventorySnapshotRecord>, int)>(([], 0));

        public Task<(IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)?> ListResourcesBySnapshotIdPagedAsync(
            ScopeContext scope,
            Guid snapshotId,
            int page,
            int pageSize,
            Guid? cloudResourceId = null,
            CancellationToken cancellationToken = default)
        {
            if (!Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot))
                return Task.FromResult<(IReadOnlyList<AzureInventoryResourceRecord>, int)?>(null);

            IEnumerable<AzureInventoryResourceRecord> resources = snapshot.Resources;

            if (cloudResourceId is Guid resourceId && resourceId != Guid.Empty)
                resources = resources.Where(item => item.CloudResourceId == resourceId);

            IReadOnlyList<AzureInventoryResourceRecord> items = resources.Take(pageSize).ToList();

            return Task.FromResult<(IReadOnlyList<AzureInventoryResourceRecord>, int)?>((items, items.Count));
        }

        public Task<IReadOnlyList<AzureInventoryResourcePropertyReadModel>> ListResourcePropertiesByResourceRowIdAsync(
            ScopeContext scope,
            Guid snapshotId,
            Guid resourceRowId,
            CancellationToken cancellationToken = default)
        {
            if (!Snapshots.TryGetValue(snapshotId, out AzureInventorySnapshotDetailReadModel? snapshot))
                return Task.FromResult<IReadOnlyList<AzureInventoryResourcePropertyReadModel>>([]);

            return Task.FromResult<IReadOnlyList<AzureInventoryResourcePropertyReadModel>>(
                snapshot.Properties.Where(item => item.ResourceRowId == resourceRowId).ToList());
        }

        public Task<AzureInventorySnapshotDeleteResult> TryDeleteSnapshotAsync(
            ScopeContext scope,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new AzureInventorySnapshotDeleteResult
            {
                Outcome = AzureInventorySnapshotDeleteOutcome.NotFound,
            });
    }

    private sealed class PassingVerifyHarness
    {
        public required InMemoryRemediationInstanceRepository Instances
        {
            get;
            init;
        }

        public required InMemorySnapshotRepository Snapshots
        {
            get;
            init;
        }

        public required InMemoryVerifiedRemediationControlAssociationRepository Associations
        {
            get;
            init;
        }

        public required RemediationInstanceService Service
        {
            get;
            init;
        }

        public required Guid InstanceId
        {
            get;
            init;
        }

        public required Guid ResourceRowId
        {
            get;
            init;
        }
    }

    private sealed class ThrowingAssociationRepository : IVerifiedRemediationControlAssociationRepository
    {
        public Task<VerifiedRemediationControlAssociationRecord> UpsertAsync(
            ProjectScopeKey scope,
            VerifiedRemediationControlAssociationRecord record,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("association store unavailable");

        public Task<VerifiedRemediationControlAssociationRecord?> TryGetAsync(
            ProjectScopeKey scope,
            Guid associationId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<VerifiedRemediationControlAssociationRecord?>(null);

        public Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByInstanceAsync(
            ProjectScopeKey scope,
            Guid instanceId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<VerifiedRemediationControlAssociationRecord>>([]);

        public Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByControlAndVerificationSnapshotIdsAsync(
            ProjectScopeKey scope,
            Guid controlId,
            IReadOnlyList<Guid> verificationSnapshotIds,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<VerifiedRemediationControlAssociationRecord>>([]);
    }
}
