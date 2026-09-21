using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class OperatorInferredConnectionServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid SnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task ListBySnapshotAsync_returns_existing_rows_without_generating()
    {
        OperatorInferredConnectionRecord uploadRow = CreateRecord(OperatorInferredConnectionSource.Upload);
        Mock<IOperatorInferredConnectionRepository> connectionRepository = CreateConnectionRepository([uploadRow]);
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(detailLoaded: true);
        Mock<IInferenceQuestionnaireItemGenerator> generator = new();
        generator
            .Setup(item => item.GenerateAndPersistAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<AzureInventorySnapshotDetailReadModel>(),
                It.IsAny<IReadOnlyList<OperatorInferredConnectionRecord>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("MERGE failed."));

        OperatorInferredConnectionService sut = CreateSut(
            connectionRepository.Object,
            snapshotRepository.Object,
            generator.Object);

        IReadOnlyList<OperatorInferredConnectionRecord> rows =
            await sut.ListBySnapshotAsync(Scope, SnapshotId);

        rows.Should().ContainSingle(row => row.Source == OperatorInferredConnectionSource.Upload);
        generator.Verify(
            item => item.GenerateAndPersistAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<AzureInventorySnapshotDetailReadModel>(),
                It.IsAny<IReadOnlyList<OperatorInferredConnectionRecord>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        snapshotRepository.Verify(
            repository => repository.TryGetSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListQuestionnaireBySnapshotAsync_returns_generated_questionnaire_rows()
    {
        OperatorInferredConnectionRecord uploadRow = CreateRecord(OperatorInferredConnectionSource.Upload);
        OperatorInferredConnectionRecord questionnaireRow =
            CreateRecord(OperatorInferredConnectionSource.Questionnaire);
        Mock<IOperatorInferredConnectionRepository> connectionRepository = new();
        connectionRepository
            .SetupSequence(repository => repository.ListBySnapshotAsync(
                Scope.TenantId,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([uploadRow])
            .ReturnsAsync([uploadRow, questionnaireRow]);

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(detailLoaded: true);
        Mock<IInferenceQuestionnaireItemGenerator> generator = new();
        generator
            .Setup(item => item.GenerateAndPersistAsync(
                Scope,
                It.IsAny<AzureInventorySnapshotDetailReadModel>(),
                It.IsAny<IReadOnlyList<OperatorInferredConnectionRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([questionnaireRow]);

        OperatorInferredConnectionService sut = CreateSut(
            connectionRepository.Object,
            snapshotRepository.Object,
            generator.Object);

        IReadOnlyList<OperatorInferredConnectionRecord> rows =
            await sut.ListQuestionnaireBySnapshotAsync(Scope, SnapshotId);

        rows.Should().ContainSingle(row => row.Source == OperatorInferredConnectionSource.Questionnaire);
        rows.Should().NotContain(row => row.Source == OperatorInferredConnectionSource.Upload);
        generator.Verify(
            item => item.GenerateAndPersistAsync(
                Scope,
                It.IsAny<AzureInventorySnapshotDetailReadModel>(),
                It.IsAny<IReadOnlyList<OperatorInferredConnectionRecord>>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListQuestionnaireBySnapshotAsync_logs_and_rethrows_when_generate_fails()
    {
        InvalidOperationException generateException = new("MERGE failed.");
        Mock<IOperatorInferredConnectionRepository> connectionRepository =
            CreateConnectionRepository([CreateRecord(OperatorInferredConnectionSource.Upload)]);
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(detailLoaded: true);
        Mock<IInferenceQuestionnaireItemGenerator> generator = new();
        generator
            .Setup(item => item.GenerateAndPersistAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<AzureInventorySnapshotDetailReadModel>(),
                It.IsAny<IReadOnlyList<OperatorInferredConnectionRecord>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(generateException);

        Mock<ILogger<OperatorInferredConnectionService>> logger = new();
        OperatorInferredConnectionService sut = CreateSut(
            connectionRepository.Object,
            snapshotRepository.Object,
            generator.Object,
            logger.Object);

        Func<Task> act = () => sut.ListQuestionnaireBySnapshotAsync(Scope, SnapshotId);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("MERGE failed.");
        logger.Verify(
            item => item.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) =>
                    state.ToString()!.Contains(SnapshotId.ToString(), StringComparison.Ordinal)),
                generateException,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ListQuestionnaireBySnapshotAsync_does_not_log_cancellation_as_generate_failure()
    {
        Mock<IOperatorInferredConnectionRepository> connectionRepository =
            CreateConnectionRepository([CreateRecord(OperatorInferredConnectionSource.Upload)]);
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(detailLoaded: true);
        Mock<IInferenceQuestionnaireItemGenerator> generator = new();
        generator
            .Setup(item => item.GenerateAndPersistAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<AzureInventorySnapshotDetailReadModel>(),
                It.IsAny<IReadOnlyList<OperatorInferredConnectionRecord>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        Mock<ILogger<OperatorInferredConnectionService>> logger = new();
        OperatorInferredConnectionService sut = CreateSut(
            connectionRepository.Object,
            snapshotRepository.Object,
            generator.Object,
            logger.Object);

        Func<Task> act = () => sut.ListQuestionnaireBySnapshotAsync(Scope, SnapshotId);

        await act.Should().ThrowAsync<OperationCanceledException>();
        logger.Verify(
            item => item.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    [Fact]
    public async Task ConfirmAsync_foreign_project_connection_returns_not_found()
    {
        OperatorInferredConnectionRecord foreign = CreateRecord(
            OperatorInferredConnectionSource.Questionnaire,
            Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));

        Mock<IOperatorInferredConnectionRepository> connectionRepository = new();
        connectionRepository
            .Setup(repository => repository.TryGetByIdInScopeAsync(
                Scope.ToProjectScopeKey(),
                foreign.ConnectionId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((OperatorInferredConnectionRecord?)null);

        OperatorInferredConnectionService sut = CreateSut(
            connectionRepository.Object,
            CreateSnapshotRepository(detailLoaded: true).Object,
            Mock.Of<IInferenceQuestionnaireItemGenerator>());

        OperatorInferredConnectionMutationResult result = await sut.ConfirmAsync(
            Scope,
            SnapshotId,
            new OperatorInferredConnectionConfirmRequest { ConnectionId = foreign.ConnectionId },
            "actor");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Be("Inferred connection was not found.");

        connectionRepository.Verify(repository => repository.TryGetByIdInScopeAsync(
            Scope.ToProjectScopeKey(),
            foreign.ConnectionId,
            It.IsAny<CancellationToken>()), Times.Once);
        connectionRepository.Verify(repository => repository.UpdateStatusInScopeAsync(
            It.IsAny<ProjectScopeKey>(),
            It.IsAny<OperatorInferredConnectionMutation>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    private static OperatorInferredConnectionService CreateSut(
        IOperatorInferredConnectionRepository connectionRepository,
        IAzureInventorySnapshotRepository snapshotRepository,
        IInferenceQuestionnaireItemGenerator generator,
        ILogger<OperatorInferredConnectionService>? logger = null)
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new OperatorInferredConnectionService(
            connectionRepository,
            snapshotRepository,
            generator,
            auditService.Object,
            logger ?? NullLogger<OperatorInferredConnectionService>.Instance);
    }

    private static Mock<IOperatorInferredConnectionRepository> CreateConnectionRepository(
        IReadOnlyList<OperatorInferredConnectionRecord> rows)
    {
        Mock<IOperatorInferredConnectionRepository> repository = new();
        repository
            .Setup(item => item.ListBySnapshotAsync(
                Scope.TenantId,
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        return repository;
    }

    private static Mock<IAzureInventorySnapshotRepository> CreateSnapshotRepository(bool detailLoaded)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(item => item.TryGetBySnapshotIdAsync(Scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
            });

        repository
            .Setup(item => item.TryGetSnapshotDetailAsync(Scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                detailLoaded
                    ? new AzureInventorySnapshotDetailReadModel
                    {
                        Header = new AzureInventorySnapshotRecord
                        {
                            SnapshotId = SnapshotId,
                            TenantId = Scope.TenantId,
                            WorkspaceId = Scope.WorkspaceId,
                            ProjectId = Scope.ProjectId,
                        },
                    }
                    : null);

        return repository;
    }

    private static OperatorInferredConnectionRecord CreateRecord(
        OperatorInferredConnectionSource source,
        Guid? projectId = null) =>
        new()
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = projectId ?? Scope.ProjectId,
            SnapshotId = SnapshotId,
            Status = OperatorInferredConnectionStatus.Proposed,
            Source = source,
            ToHost = "api.example.com",
            ProposalPayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };
}
