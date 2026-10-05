using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowQuestionCompilerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public void Missing_azure_object_does_not_become_a_question()
    {
        IReadOnlyList<SecureNowQuestionRecord> questions = Compile(
            new SecureNowDiagramQuestionCandidate
            {
                ResourceId = "/subscriptions/sub/resource",
                IsOrphanIntent = true,
                IsKnownMissingAzureObject = true,
                ProblemText = "required parent no longer exists",
            });

        questions.Should().BeEmpty();
    }

    [Fact]
    public void Orphan_intent_emits_one_question_per_resource()
    {
        IReadOnlyList<SecureNowQuestionRecord> questions = Compile(
            new SecureNowDiagramQuestionCandidate
            {
                ResourceId = "/subscriptions/sub/resource",
                IsOrphanIntent = true,
                ProblemText = "required subnet no longer exists",
            },
            new SecureNowDiagramQuestionCandidate
            {
                ResourceId = "/subscriptions/sub/resource",
                IsOrphanIntent = true,
                ProblemText = "required parent no longer exists",
            });

        questions.Should().ContainSingle();
        questions[0].QuestionKey.Should().Be("orphan-still-needed@v1");
        questions[0].AnswerCodes.Should().Equal("Retire", "Keep", "NotSure");
    }

    [Fact]
    public void Empty_unknown_detail_does_not_become_a_question()
    {
        IReadOnlyList<SecureNowQuestionRecord> questions = Compile(
            new SecureNowDiagramQuestionCandidate
            {
                ResourceId = "/subscriptions/sub/resource",
                IsUnknownEvidence = true,
            });

        questions.Should().BeEmpty();
    }

    [Fact]
    public void Unknown_with_actionable_evidence_emits_a_question()
    {
        const string resourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev";

        IReadOnlyList<SecureNowQuestionRecord> questions = new SecureNowQuestionCompiler().Compile(
            Scope,
            CreateSnapshot(
                [
                    new AzureInventoryResourceRecord
                    {
                        AzureResourceId = resourceId,
                        ResourceType = "Microsoft.DataFactory/factories",
                    },
                ]),
            [
                new SecureNowDiagramQuestionCandidate
                {
                    ResourceId = resourceId,
                    ResourceType = "Microsoft.DataFactory/factories",
                    IsUnknownEvidence = true,
                    ProblemText = "No cited connection, but a peer may be expected.",
                },
            ],
            [],
            []);

        questions.Should().ContainSingle();
        questions[0].QuestionKey.Should().Be("unknown-evidence@v1");
        questions[0].AnswerCodes.Should().Equal("NamePeer", "StandsAlone", "NotSure");
        questions[0].ResourceName.Should().Be("adf-edw-hi-dev");
        questions[0].ResourceType.Should().Be("Microsoft.DataFactory/factories");
        questions[0].QuestionText.Should().Be("Should adf-edw-hi-dev connect to a peer, or stand alone?");
        questions[0].ReasonText.Should().Contain("adf-edw-hi-dev");
        questions[0].ReasonText.Should().Contain("shared service");
    }

    [Fact]
    public void Orphan_intent_names_the_resource_and_states_why()
    {
        const string resourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-01";

        IReadOnlyList<SecureNowQuestionRecord> questions = new SecureNowQuestionCompiler().Compile(
            Scope,
            CreateSnapshot(
                [
                    new AzureInventoryResourceRecord
                    {
                        AzureResourceId = resourceId,
                        ResourceType = "Microsoft.Web/sites",
                    },
                ]),
            [
                new SecureNowDiagramQuestionCandidate
                {
                    ResourceId = resourceId,
                    ResourceType = "Microsoft.Web/sites",
                    IsOrphanIntent = true,
                    ProblemText = "required subnet no longer exists",
                },
            ],
            [],
            []);

        questions.Should().ContainSingle();
        questions[0].QuestionText.Should().Be("Is app-01 still needed?");
        questions[0].ReasonText.Should().Contain("could not find the parent");
        questions[0].ReasonText.Should().Contain("app-01");
    }

    [Fact]
    public void Proposed_inference_item_is_projected_into_the_same_list()
    {
        IReadOnlyList<SecureNowQuestionRecord> questions = new SecureNowQuestionCompiler().Compile(
            Scope,
            CreateSnapshot(),
            [],
            [
                new OperatorInferredConnectionRecord
                {
                    ConnectionId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    Status = OperatorInferredConnectionStatus.Proposed,
                    Source = OperatorInferredConnectionSource.Questionnaire,
                    RuleName = "Unresolved host",
                    QuestionText = "Should this host connect to the app?",
                    FromArmId = "/subscriptions/sub/resource",
                    ToArmId = "/subscriptions/sub/target",
                },
            ],
            []);

        questions.Should().ContainSingle();
        questions[0].Source.Should().Be(SecureNowQuestionSource.InferredConnection);
        questions[0].QuestionText.Should().Be("Should this host connect to the app?");
        questions[0].ReasonText.Should().Contain("inferred a connection");
        questions[0].ResourceName.Should().Be("resource");
    }

    [Fact]
    public void Inferred_question_uses_the_populated_endpoint_when_the_source_arm_id_is_blank()
    {
        const string targetArmId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/target";

        IReadOnlyList<SecureNowQuestionRecord> questions = new SecureNowQuestionCompiler().Compile(
            Scope,
            CreateSnapshot(),
            [],
            [
                new OperatorInferredConnectionRecord
                {
                    ConnectionId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    Status = OperatorInferredConnectionStatus.Proposed,
                    Source = OperatorInferredConnectionSource.Questionnaire,
                    RuleName = "Unresolved host",
                    QuestionText = "Should this host connect to the app?",
                    FromArmId = " ",
                    ToArmId = targetArmId,
                },
            ],
            []);

        questions.Should().ContainSingle();
        questions[0].ResourceId.Should().Be(targetArmId.ToLowerInvariant());
    }

    [Fact]
    public void A_matching_disposition_is_joined_without_creating_a_second_row()
    {
        SecureNowQuestionCompiler compiler = new();
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshot();
        SecureNowQuestionDispositionRecord disposition = new()
        {
            DispositionId = Guid.NewGuid(),
            TenantId = Scope.TenantId,
            SnapshotId = SnapshotId,
            SubscriptionId = "sub",
            ResourceId = "/subscriptions/sub/resource",
            QuestionKey = "unknown-evidence@v1",
            Status = SecureNowQuestionDispositionStatus.Ignored,
            EvidenceFingerprint = Fingerprint("unknown-evidence@v1", "/subscriptions/sub/resource", "peer"),
            Reason = "Reviewed.",
            ExpirationUtc = DateTime.UtcNow.AddDays(10),
        };

        IReadOnlyList<SecureNowQuestionRecord> questions = compiler.Compile(
            Scope,
            snapshot,
            [
                new SecureNowDiagramQuestionCandidate
                {
                    ResourceId = "/subscriptions/sub/resource",
                    IsUnknownEvidence = true,
                    ProblemText = "peer",
                },
            ],
            [],
            [disposition]);

        questions.Should().ContainSingle();
        questions[0].Status.Should().Be(SecureNowQuestionDispositionStatus.Ignored);
        questions[0].DispositionId.Should().Be(disposition.DispositionId);
    }

    private static IReadOnlyList<SecureNowQuestionRecord> Compile(
        params SecureNowDiagramQuestionCandidate[] candidates) =>
        new SecureNowQuestionCompiler().Compile(
            Scope,
            CreateSnapshot(),
            candidates,
            [],
            []);

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord>? resources = null) =>
        new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                SubscriptionId = "sub",
            },
            Resources = resources ?? [],
        };

    private static readonly Guid SnapshotId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static string Fingerprint(string key, string resource, string problem) =>
        Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes($"{key}\n{resource}\n{problem}")));
}
