using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowQuestionDispositionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid SnapshotId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task Ignore_is_returned_for_a_later_snapshot_of_the_same_subscription_and_resource()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult ignored = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("SUB-1", "/subscriptions/SUB-1/resource"),
            "actor");

        ignored.Succeeded.Should().BeTrue();

        IReadOnlyList<SecureNowQuestionDispositionRecord> rows = await sut.ListAsync(
            Scope,
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));

        rows.Should().ContainSingle();
        rows[0].Status.Should().Be(SecureNowQuestionDispositionStatus.Ignored);
    }

    [Fact]
    public async Task Question_key_is_case_insensitive_on_ignore()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource"),
            "actor");

        SecureNowQuestionDispositionMutationResult second = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource")
                with { QuestionKey = "Unknown-Evidence@v1", Reason = "Second write." },
            "actor");

        second.Succeeded.Should().BeTrue();
        repository.Rows.Should().ContainSingle();
        repository.Rows[0].QuestionKey.Should().Be("unknown-evidence@v1");
    }

    [Fact]
    public async Task Resource_identity_is_case_insensitive()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource"),
            "actor");

        SecureNowQuestionDispositionRecord? row = await repository.TryGetByIdentityAsync(
            Scope.TenantId,
            "SUB-1",
            "/SUBSCRIPTIONS/SUB-1/RESOURCE",
            "unknown-evidence@v1");

        row.Should().NotBeNull();
    }

    [Fact]
    public async Task Different_subscription_does_not_see_the_row()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource"),
            "actor");

        IReadOnlyList<SecureNowQuestionDispositionRecord> rows = await sut.ListAsync(
            Scope,
            SnapshotId,
            CancellationToken.None);

        rows.Should().ContainSingle();
        rows[0].SubscriptionId.Should().Be("sub-1");
    }

[Fact]
public async Task Foreign_snapshot_cannot_read_or_write()
{
    InMemoryDispositionRepository repository = new();
    SecureNowQuestionDispositionService sut = CreateSut(repository, snapshotOwned: false);

    SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
        Scope,
        SnapshotId,
        CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource"),
        "actor");
    IReadOnlyList<SecureNowQuestionDispositionRecord> rows = await sut.ListAsync(Scope, SnapshotId);

    result.Succeeded.Should().BeFalse();
    result.ErrorMessage.Should().Be("Snapshot was not found.");
    repository.Rows.Should().BeEmpty();
    rows.Should().BeEmpty();
}

    [Fact]
    public async Task Ignore_requires_reason_and_expiration_cannot_exceed_ninety_days()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult noReason = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with { Reason = " " },
            "actor");
        SecureNowQuestionDispositionMutationResult tooLong = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                ExpirationUtc = DateTime.UtcNow.AddDays(91),
            },
            "actor");

        noReason.ErrorMessage.Should().Be("Reason is required.");
        tooLong.ErrorMessage.Should().Be("ExpirationUtc cannot be more than 90 days ahead.");
    }

    [Fact]
    public async Task Reopen_sets_open_and_appends_an_audit_entry()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);
        SecureNowQuestionDispositionWriteRequest request =
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource");

        await sut.IgnoreAsync(Scope, SnapshotId, request, "actor");
        SecureNowQuestionDispositionMutationResult reopened = await sut.ReopenAsync(
            Scope,
            SnapshotId,
            new SecureNowQuestionDispositionReopenRequest
            {
                SubscriptionId = request.SubscriptionId,
                ResourceId = request.ResourceId,
                QuestionKey = request.QuestionKey,
                Reason = "Evidence changed.",
            },
            "reviewer");

        reopened.Succeeded.Should().BeTrue();
        reopened.Record!.Status.Should().Be(SecureNowQuestionDispositionStatus.Open);
        reopened.Record.AuditEntries.Should().ContainSingle(entry =>
            entry.Action == "Reopened" && entry.Reason == "Evidence changed.");
    }

    [Fact]
    public async Task Reopen_renews_an_expired_disposition()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);
        SecureNowQuestionDispositionWriteRequest request =
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource");

        await sut.IgnoreAsync(Scope, SnapshotId, request, "actor");
        repository.Rows[0] = repository.Rows[0] with
        {
            ExpirationUtc = DateTime.UtcNow.AddMinutes(-1),
        };

        SecureNowQuestionDispositionMutationResult reopened = await sut.ReopenAsync(
            Scope,
            SnapshotId,
            new SecureNowQuestionDispositionReopenRequest
            {
                SubscriptionId = request.SubscriptionId,
                ResourceId = request.ResourceId,
                QuestionKey = request.QuestionKey,
                Reason = "Evidence changed.",
            },
            "reviewer");

        reopened.Succeeded.Should().BeTrue();
        reopened.Record!.ExpirationUtc.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task Reopen_clears_prior_answer_fields_from_listed_questions()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository, includeQuestion: true);
        SecureNowQuestionDispositionWriteRequest request =
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource");

        await sut.AnswerAsync(Scope, SnapshotId, request, "actor");
        SecureNowQuestionDispositionMutationResult reopened = await sut.ReopenAsync(
            Scope,
            SnapshotId,
            new SecureNowQuestionDispositionReopenRequest
            {
                SubscriptionId = request.SubscriptionId,
                ResourceId = request.ResourceId,
                QuestionKey = request.QuestionKey,
                Reason = "Evidence changed.",
            },
            "reviewer");

        reopened.Succeeded.Should().BeTrue();
        reopened.Record!.Status.Should().Be(SecureNowQuestionDispositionStatus.Open);
        reopened.Record.AnswerCode.Should().BeNull();
        reopened.Record.AnswerText.Should().BeNull();
        reopened.Record.Reason.Should().BeEmpty();

        IReadOnlyList<SecureNowQuestionRecord> listed =
            await sut.ListQuestionsAsync(Scope, SnapshotId);
        SecureNowQuestionRecord question = listed.Should().ContainSingle().Subject;
        question.Status.Should().Be(SecureNowQuestionDispositionStatus.Open);
        question.AnswerCode.Should().BeNull();
        question.AnswerText.Should().BeNull();
        question.Reason.Should().BeNull();
    }

    [Fact]
    public async Task Question_key_requires_a_positive_version()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = "orphan-still-needed",
            },
            "actor");

        result.ErrorMessage.Should().Be("QuestionKey must end with a positive version such as @v1.");
    }

    [Fact]
    public async Task Question_key_cannot_exceed_the_persistence_column_limit()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = $"{new string('q', 300)}@v1",
            },
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("QuestionKey is too long.");
        repository.Rows.Should().BeEmpty();
    }

    [Fact]
    public async Task Null_resource_id_is_rejected_as_validation_error()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", null!),
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("ResourceId is required.");
        repository.Rows.Should().BeEmpty();
    }

    [Fact]
    public async Task Scope_kind_must_be_a_defined_value()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository);

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                ScopeKind = (SecureNowQuestionScopeKind)999,
            },
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("ScopeKind is invalid.");
        repository.Rows.Should().BeEmpty();
    }

    [Fact]
    public async Task Answer_code_must_be_one_of_the_compiled_question_choices()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository, includeQuestion: true);

        SecureNowQuestionDispositionMutationResult result = await sut.AnswerAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = "unknown-evidence@v1",
                AnswerCode = "InventedAnswer",
                EvidenceFingerprint = "C70C7C824299E81D30618883C7BF8C4833B97799C8BBD8B92017CC6CE1E7C9AD",
            },
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("AnswerCode is invalid.");
        repository.Rows.Should().BeEmpty();
    }

    [Fact]
    public async Task Stale_evidence_fingerprint_is_rejected_before_persisting_an_answer()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository, includeQuestion: true);

        SecureNowQuestionDispositionMutationResult result = await sut.AnswerAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = "unknown-evidence@v1",
                AnswerCode = "NamePeer",
                EvidenceFingerprint = "stale-fingerprint",
            },
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Question evidence has changed.");
        repository.Rows.Should().BeEmpty();
    }

    [Fact]
    public async Task Stale_evidence_fingerprint_is_rejected_before_persisting_an_ignore()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(repository, includeQuestion: true);

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = "unknown-evidence@v1",
                EvidenceFingerprint = "stale-fingerprint",
            },
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Question evidence has changed.");
        repository.Rows.Should().BeEmpty();
    }

    [Fact]
    public async Task Inferred_connection_ignore_validates_against_the_compiled_question()
    {
        InMemoryDispositionRepository repository = new();
        OperatorInferredConnectionRecord inferred = new()
        {
            ConnectionId = Guid.NewGuid(),
            SnapshotId = SnapshotId,
            Status = OperatorInferredConnectionStatus.Proposed,
            Source = OperatorInferredConnectionSource.Questionnaire,
            RuleName = "Unresolved host",
            QuestionText = "Should this host connect to the app?",
            FromArmId = "/subscriptions/sub-1/resource",
            ToArmId = "/subscriptions/sub-1/target",
        };
        SecureNowQuestionDispositionService sut = CreateSut(
            repository,
            includeQuestion: false,
            inferredConnections: [inferred]);

        IReadOnlyList<SecureNowQuestionRecord> questions =
            await sut.ListQuestionsAsync(Scope, SnapshotId);
        SecureNowQuestionRecord question = questions.Should().ContainSingle().Subject;

        SecureNowQuestionDispositionMutationResult result = await sut.IgnoreAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", question.ResourceId) with
            {
                QuestionKey = question.QuestionKey,
                Source = SecureNowQuestionSource.InferredConnection,
                AnswerCode = null,
                AnswerText = null,
                EvidenceFingerprint = question.EvidenceFingerprint,
            },
            "actor");

        result.Succeeded.Should().BeTrue();
        repository.Rows.Should().ContainSingle(row =>
            row.Status == SecureNowQuestionDispositionStatus.Ignored
            && row.Source == SecureNowQuestionSource.InferredConnection);
    }

    [Fact]
    public async Task Orphan_question_is_emitted_when_parent_is_missing_from_snapshot_P11()
    {
        InMemoryDispositionRepository repository = new();
        const string childResourceId =
            "/subscriptions/sub-1/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-child";
        const string missingParentId =
            "/subscriptions/sub-1/resourceGroups/rg/providers/Microsoft.Compute/virtualMachineScaleSets/vmss-missing";
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots
            .Setup(item => item.TryGetSnapshotDetailAsync(
                Scope,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel
            {
                Header = new AzureInventorySnapshotRecord
                {
                    SubscriptionId = "sub-1",
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                },
                Resources =
                [
                    new AzureInventoryResourceRecord
                    {
                        AzureResourceId = childResourceId,
                        ResourceType = "Microsoft.Compute/virtualMachines",
                        ParentResourceId = missingParentId,
                    },
                ],
            });
        SecureNowQuestionDispositionService sut = new(repository, snapshots.Object, new Mock<IAuditService>().Object);

        IReadOnlyList<SecureNowQuestionRecord> questions =
            await sut.ListQuestionsAsync(Scope, SnapshotId);

        questions.Should().ContainSingle(question =>
            question.QuestionKey == "orphan-still-needed@v1"
            && string.Equals(
                question.ResourceId,
                childResourceId,
                StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Unknown_evidence_question_is_emitted_when_relationship_peer_is_not_in_snapshot()
    {
        InMemoryDispositionRepository repository = new();
        const string resourceId = "/subscriptions/sub-1/resource";
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots
            .Setup(item => item.TryGetSnapshotDetailAsync(
                Scope,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel
            {
                Header = new AzureInventorySnapshotRecord
                {
                    SubscriptionId = "sub-1",
                    TenantId = Scope.TenantId,
                    WorkspaceId = Scope.WorkspaceId,
                    ProjectId = Scope.ProjectId,
                },
                Resources =
                [
                    new AzureInventoryResourceRecord
                    {
                        AzureResourceId = resourceId,
                        ResourceType = "Microsoft.DataFactory/factories",
                    },
                ],
                Relationships =
                [
                    new AzureInventoryResourceRelationshipReadModel
                    {
                        FromAzureResourceId = resourceId,
                        ToAzureResourceId = "/subscriptions/sub-1/missing-peer",
                    },
                ],
            });
        Mock<IAuditService> audit = new();
        SecureNowQuestionDispositionService sut = new(
            repository,
            snapshots.Object,
            audit.Object);

        IReadOnlyList<SecureNowQuestionRecord> questions =
            await sut.ListQuestionsAsync(Scope, SnapshotId);

        questions.Should().ContainSingle(question => question.QuestionKey == "unknown-evidence@v1");
    }

    [Fact]
    public async Task Subscription_scope_pack_question_accepts_empty_resource_id_on_answer()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(
            repository,
            includeInventoryQuestion: false,
            includePackElicitation: true);

        IReadOnlyList<SecureNowQuestionRecord> listed =
            await sut.ListQuestionsAsync(Scope, SnapshotId);
        SecureNowQuestionRecord packQuestion = listed.Should().ContainSingle().Subject;
        packQuestion.ScopeKind.Should().Be(SecureNowQuestionScopeKind.Subscription);
        packQuestion.ResourceId.Should().BeEmpty();

        SecureNowQuestionDispositionMutationResult answered = await sut.AnswerAsync(
            Scope,
            SnapshotId,
            new SecureNowQuestionDispositionWriteRequest
            {
                SubscriptionId = "sub-1",
                ResourceId = string.Empty,
                QuestionKey = packQuestion.QuestionKey,
                Source = SecureNowQuestionSource.PolicyPack,
                ScopeKind = SecureNowQuestionScopeKind.Subscription,
                AnswerCode = packQuestion.AnswerCodes[0],
                AnswerText = packQuestion.AnswerCodes[0],
                Reason = "Pack elicitation reviewed.",
                EvidenceFingerprint = packQuestion.EvidenceFingerprint,
            },
            "actor");

        answered.Succeeded.Should().BeTrue();
        answered.Record!.ResourceId.Should().Be("sub-1");

        IReadOnlyList<SecureNowQuestionRecord> afterAnswer =
            await sut.ListQuestionsAsync(Scope, SnapshotId);
        afterAnswer.Should().ContainSingle();
        afterAnswer[0].Status.Should().Be(SecureNowQuestionDispositionStatus.Answered);
        afterAnswer[0].AnswerCode.Should().Be(packQuestion.AnswerCodes[0]);
    }

    [Fact]
    public async Task Subscription_scope_pack_question_accepts_empty_resource_id_on_reopen()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(
            repository,
            includeInventoryQuestion: false,
            includePackElicitation: true);

        IReadOnlyList<SecureNowQuestionRecord> listed =
            await sut.ListQuestionsAsync(Scope, SnapshotId);
        SecureNowQuestionRecord packQuestion = listed.Should().ContainSingle().Subject;

        SecureNowQuestionDispositionWriteRequest answerRequest =
            new()
            {
                SubscriptionId = "sub-1",
                ResourceId = string.Empty,
                QuestionKey = packQuestion.QuestionKey,
                Source = SecureNowQuestionSource.PolicyPack,
                ScopeKind = SecureNowQuestionScopeKind.Subscription,
                AnswerCode = packQuestion.AnswerCodes[0],
                AnswerText = packQuestion.AnswerCodes[0],
                Reason = "Pack elicitation reviewed.",
                EvidenceFingerprint = packQuestion.EvidenceFingerprint,
            };

        await sut.AnswerAsync(Scope, SnapshotId, answerRequest, "actor");

        SecureNowQuestionDispositionMutationResult reopened = await sut.ReopenAsync(
            Scope,
            SnapshotId,
            new SecureNowQuestionDispositionReopenRequest
            {
                SubscriptionId = answerRequest.SubscriptionId,
                ResourceId = string.Empty,
                QuestionKey = answerRequest.QuestionKey,
                Reason = "Need to revise the pack answer.",
            },
            "reviewer");

        reopened.Succeeded.Should().BeTrue();
        reopened.Record!.Status.Should().Be(SecureNowQuestionDispositionStatus.Open);
        reopened.Record.AnswerCode.Should().BeNull();

        IReadOnlyList<SecureNowQuestionRecord> afterReopen =
            await sut.ListQuestionsAsync(Scope, SnapshotId);
        afterReopen.Should().ContainSingle();
        afterReopen[0].Status.Should().Be(SecureNowQuestionDispositionStatus.Open);
        afterReopen[0].AnswerCode.Should().BeNull();
    }

    [Fact]
    public async Task Inventory_answer_does_not_depend_on_inferred_connection_availability()
    {
        InMemoryDispositionRepository repository = new();
        SecureNowQuestionDispositionService sut = CreateSut(
            repository,
            includeQuestion: true,
            inferredConnectionsUnavailable: true);

        SecureNowQuestionDispositionMutationResult result = await sut.AnswerAsync(
            Scope,
            SnapshotId,
            CreateWriteRequest("sub-1", "/subscriptions/sub-1/resource") with
            {
                QuestionKey = "unknown-evidence@v1",
                AnswerCode = "NamePeer",
                EvidenceFingerprint = "C70C7C824299E81D30618883C7BF8C4833B97799C8BBD8B92017CC6CE1E7C9AD",
            },
            "actor");

        result.Succeeded.Should().BeTrue();
        repository.Rows.Should().ContainSingle(row =>
            row.Status == SecureNowQuestionDispositionStatus.Answered
            && row.AnswerCode == "NamePeer");
    }

    private const string UnknownEvidenceFingerprint =
        "C70C7C824299E81D30618883C7BF8C4833B97799C8BBD8B92017CC6CE1E7C9AD";

    private static SecureNowQuestionDispositionService CreateSut(
        InMemoryDispositionRepository repository,
        bool snapshotOwned = true,
        bool includeQuestion = true,
        bool includeInventoryQuestion = true,
        bool includePackElicitation = false,
        bool inferredConnectionsUnavailable = false,
        IReadOnlyList<OperatorInferredConnectionRecord>? inferredConnections = null)
    {
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        snapshots
            .Setup(item => item.TryGetBySnapshotIdAsync(
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ScopeContext _, Guid _, CancellationToken _) => snapshotOwned
                    ? new AzureInventorySnapshotRecord
                    {
                        SubscriptionId = "sub-1",
                        TenantId = Scope.TenantId,
                        WorkspaceId = Scope.WorkspaceId,
                        ProjectId = Scope.ProjectId,
                    }
                    : null);
        snapshots
            .Setup(item => item.TryGetSnapshotDetailAsync(
                Scope,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                (ScopeContext _, Guid _, CancellationToken _) => snapshotOwned
                    ? new AzureInventorySnapshotDetailReadModel
                    {
                        Header = new AzureInventorySnapshotRecord
                        {
                            SubscriptionId = "sub-1",
                            TenantId = Scope.TenantId,
                            WorkspaceId = Scope.WorkspaceId,
                            ProjectId = Scope.ProjectId,
                        },
                        Resources = includeQuestion && includeInventoryQuestion
                            ? [
                                new AzureInventoryResourceRecord
                                {
                                    AzureResourceId = "/subscriptions/sub-1/resource",
                                    ResourceType = "Microsoft.DataFactory/factories",
                                },
                            ]
                            : [],
                    }
                    : null);

        Mock<IEffectiveGovernanceLoader>? governanceLoader = null;
        Mock<IAzureInventorySnapshotGraphResolver>? graphResolver = null;

        if (includePackElicitation)
        {
            governanceLoader = new Mock<IEffectiveGovernanceLoader>();
            governanceLoader
                .Setup(item => item.LoadEffectiveContentAsync(
                    Scope.TenantId,
                    Scope.WorkspaceId,
                    Scope.ProjectId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PolicyPackContentDocument
                {
                    ElicitationQuestions =
                    [
                        new ElicitationQuestion
                        {
                            QuestionKey = "subscription-ownership",
                            Prompt = "Who owns this subscription workload?",
                            Tier = ElicitationQuestionTier.Must,
                            AnswerKind = ElicitationAnswerKind.Text,
                        },
                    ],
                });

            graphResolver = new Mock<IAzureInventorySnapshotGraphResolver>();
            graphResolver
                .Setup(item => item.ResolveGraphFromSnapshot(It.IsAny<AzureInventorySnapshotDetailReadModel>()))
                .Returns(new AzureInventorySnapshotGraphResolveResult { Succeeded = false });
        }

        Mock<IAuditService> audit = new();
        audit
            .Setup(item => item.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOperatorInferredConnectionRepository>? inferredConnectionsMock = null;

        if (inferredConnectionsUnavailable)
        {
            inferredConnectionsMock = new Mock<IOperatorInferredConnectionRepository>();
            inferredConnectionsMock
                .Setup(item => item.ListBySnapshotAsync(
                    Scope.TenantId,
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("inferred connections unavailable"));
        }
        else if (inferredConnections is not null)
        {
            inferredConnectionsMock = new Mock<IOperatorInferredConnectionRepository>();
            inferredConnectionsMock
                .Setup(item => item.ListBySnapshotAsync(
                    Scope.TenantId,
                    It.IsAny<Guid>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(inferredConnections);
        }

        return new SecureNowQuestionDispositionService(
            repository,
            snapshots.Object,
            audit.Object,
            inferredConnectionsMock?.Object,
            governanceLoader?.Object,
            graphResolver?.Object);
    }

    private static SecureNowQuestionDispositionWriteRequest CreateWriteRequest(
        string subscriptionId,
        string resourceId) =>
        new()
        {
            SubscriptionId = subscriptionId,
            ResourceId = resourceId,
            QuestionKey = "unknown-evidence@v1",
            Source = SecureNowQuestionSource.InventoryEvidence,
            ScopeKind = SecureNowQuestionScopeKind.Resource,
            AnswerCode = "NamePeer",
            AnswerText = "Keep it.",
            Reason = "Reviewed by operator.",
            EvidenceFingerprint = UnknownEvidenceFingerprint,
        };

    private sealed class InMemoryDispositionRepository : ISecureNowQuestionDispositionRepository
    {
        public List<SecureNowQuestionDispositionRecord> Rows { get; } = [];

        public Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListByTenantAndSubscriptionAsync(
            Guid tenantId,
            string subscriptionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecureNowQuestionDispositionRecord>>(
                Rows
                    .Where(row => row.TenantId == tenantId
                                  && string.Equals(row.SubscriptionId, subscriptionId, StringComparison.OrdinalIgnoreCase))
                    .ToList());

        public Task<SecureNowQuestionDispositionRecord?> TryGetByIdentityAsync(
            Guid tenantId,
            string subscriptionId,
            string resourceId,
            string questionKey,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                Rows.SingleOrDefault(row =>
                    row.TenantId == tenantId
                    && string.Equals(row.SubscriptionId, subscriptionId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(row.ResourceId, resourceId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(row.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase)));

        public Task UpsertAsync(
            SecureNowQuestionDispositionRecord record,
            CancellationToken cancellationToken = default)
        {
            Rows.RemoveAll(row =>
                row.TenantId == record.TenantId
                && row.SubscriptionId == record.SubscriptionId
                && row.ResourceId == record.ResourceId
                && string.Equals(row.QuestionKey, record.QuestionKey, StringComparison.OrdinalIgnoreCase));
            Rows.Add(record);
            return Task.CompletedTask;
        }
    }
}
