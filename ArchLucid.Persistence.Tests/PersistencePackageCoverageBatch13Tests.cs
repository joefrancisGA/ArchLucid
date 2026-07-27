using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Notifications.Email;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Repositories;

using Dapper;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch13Tests
{
    [Theory]
    [InlineData("RunId")]
    [InlineData("dbo.Runs.RunId")]
    public void WhereClauseMatching_ReturnsClauseWithColumnName(string columnName)
    {
        string clause = RepositoryRunIdPredicate.WhereClauseMatching(columnName);

        clause.Should().Contain($"{columnName} = @RunId");
        clause.Should().Contain("TRY_CONVERT(UNIQUEIDENTIFIER,");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void WhereClauseMatching_ThrowsForBlankColumn(string? columnName)
    {
        Action act = () => RepositoryRunIdPredicate.WhereClauseMatching(columnName!);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AddRunIdMatchParameters_ThrowsForNullParameters()
    {
        Action act = () => RepositoryRunIdPredicate.AddRunIdMatchParameters(null!, "run-1");

        act.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("11111111-1111-1111-1111-111111111111", true)]
    [InlineData("not-a-guid", false)]
    public void AddRunIdMatchParameters_SetsRunIdGuidWhenParsable(string runId, bool expectGuid)
    {
        DynamicParameters parameters = new();

        RepositoryRunIdPredicate.AddRunIdMatchParameters(parameters, runId);

        parameters.Get<string>("RunId").Should().Be(runId);

        if (expectGuid)
            parameters.Get<Guid?>("RunIdGuid").Should().Be(Guid.Parse(runId));
        else
            parameters.Get<Guid?>("RunIdGuid").Should().BeNull();
    }

    [Fact]
    public void AndProjectIdTripleWhere_reflects_tenant_presence()
    {
        ScopeContext emptyScope = new() { TenantId = Guid.Empty, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        ScopeContext populatedScope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        RepositoryScopePredicate.AndProjectIdTripleWhere(emptyScope).Should().BeEmpty();

        string clause = RepositoryScopePredicate.AndProjectIdTripleWhere(populatedScope);
        clause.Should().Contain("ProjectId = @ScopeProjectId");
        clause.Should().Contain("TenantId = @ScopeTenantId");
    }

    [Fact]
    public void AndScopeProjectIdTripleWhere_reflects_tenant_presence()
    {
        ScopeContext emptyScope = new() { TenantId = Guid.Empty, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        ScopeContext populatedScope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };

        RepositoryScopePredicate.AndScopeProjectIdTripleWhere(emptyScope).Should().BeEmpty();

        string clause = RepositoryScopePredicate.AndScopeProjectIdTripleWhere(populatedScope);
        clause.Should().Contain("ScopeProjectId = @ScopeProjectId");
        clause.Should().NotContain(" ProjectId = @ScopeProjectId AND");
    }

    [Fact]
    public async Task ExternalDbConnection_ResolveAsync_ReusesSuppliedConnection()
    {
        Mock<IDbConnectionFactory> factory = new();
        Mock<IDbConnection> suppliedConnection = new();

        (IDbConnection connection, bool ownsConnection) result =
            await ExternalDbConnection.ResolveAsync(factory.Object, suppliedConnection.Object, CancellationToken.None);

        result.connection.Should().BeSameAs(suppliedConnection.Object);
        result.ownsConnection.Should().BeFalse();
        factory.Verify(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ExternalDbConnection_ResolveAsync_OpensNewConnectionWhenNoneSupplied()
    {
        Mock<IDbConnectionFactory> factory = new();
        Mock<IDbConnection> openedConnection = new();
        factory.Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(openedConnection.Object);

        (IDbConnection connection, bool ownsConnection) result =
            await ExternalDbConnection.ResolveAsync(factory.Object, null, CancellationToken.None);

        result.connection.Should().BeSameAs(openedConnection.Object);
        result.ownsConnection.Should().BeTrue();
    }

    [Fact]
    public async Task ExternalDbConnection_ResolveAsync_ThrowsForNullFactory()
    {
        Func<Task> act = async () => await ExternalDbConnection.ResolveAsync(null!, null, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void ExternalDbConnection_DisposeIfOwned_DisposesOnlyWhenOwned()
    {
        Mock<IDbConnection> ownedConnection = new();
        Mock<IDbConnection> reusedConnection = new();

        ExternalDbConnection.DisposeIfOwned(ownedConnection.Object, ownsConnection: true);
        ExternalDbConnection.DisposeIfOwned(reusedConnection.Object, ownsConnection: false);

        ownedConnection.Verify(c => c.Dispose(), Times.Once);
        reusedConnection.Verify(c => c.Dispose(), Times.Never);
    }

    [Fact]
    public async Task SqlExternalConnection_ResolveAsync_ReusesSuppliedSqlConnection()
    {
        Mock<ISqlConnectionFactory> factory = new();
        using SqlConnection suppliedConnection = new();

        (SqlConnection connection, bool ownsConnection) result =
            await SqlExternalConnection.ResolveAsync(factory.Object, suppliedConnection, CancellationToken.None);

        result.connection.Should().BeSameAs(suppliedConnection);
        result.ownsConnection.Should().BeFalse();
    }

    [Fact]
    public async Task SqlExternalConnection_ResolveAsync_ThrowsForNonSqlConnection()
    {
        Mock<ISqlConnectionFactory> factory = new();
        Mock<IDbConnection> nonSqlConnection = new();

        Func<Task> act = async () =>
            await SqlExternalConnection.ResolveAsync(factory.Object, nonSqlConnection.Object, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public void SmtpEmailProvider_Constructor_ThrowsForNullOptionsMonitor()
    {
        Action act = () => _ = new SmtpEmailProvider(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task SmtpEmailProvider_SendAsync_ThrowsForNullMessage()
    {
        FixedOptionsMonitor<EmailNotificationOptions> options = new(new EmailNotificationOptions());
        SmtpEmailProvider provider = new(options);

        Func<Task> act = async () => await provider.SendAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task SmtpEmailProvider_SendAsync_ThrowsInvalidOperationException_WhenHostBlank()
    {
        FixedOptionsMonitor<EmailNotificationOptions> options =
            new(new EmailNotificationOptions { SmtpHost = null, FromAddress = "sender@example.com" });
        SmtpEmailProvider provider = new(options);
        EmailMessage message = CreateMessage();

        Func<Task> act = async () => await provider.SendAsync(message, CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>()).WithMessage("*SmtpHost*");
    }

    [Fact]
    public async Task SmtpEmailProvider_SendAsync_ThrowsInvalidOperationException_WhenFromAddressBlank()
    {
        FixedOptionsMonitor<EmailNotificationOptions> options =
            new(new EmailNotificationOptions { SmtpHost = "smtp.example.com", FromAddress = "   " });
        SmtpEmailProvider provider = new(options);
        EmailMessage message = CreateMessage();

        Func<Task> act = async () => await provider.SendAsync(message, CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>()).WithMessage("*FromAddress*");
    }

    [Fact]
    public void ChecklistCoverageJsonCodec_Deserialize_InvalidJson_ReturnsEmptyList()
    {
        ChecklistCoverageJsonCodec.Deserialize("{ not valid json").Should().BeEmpty();
    }

    [Fact]
    public void FindingInsightDensityColumnCodec_NullRoundTrips_ReturnNullForTreatmentAndClassification()
    {
        FindingInsightDensityColumnCodec.ToTreatmentStorage(null).Should().BeNull();
        FindingInsightDensityColumnCodec.FromTreatmentStorage(null).Should().BeNull();
        FindingInsightDensityColumnCodec.ToClassificationStorage(null).Should().BeNull();
        FindingInsightDensityColumnCodec.FromClassificationStorage(null).Should().BeNull();
    }

    [Fact]
    public void AgentTraceDocument_DefaultsAndPropertyAssignment()
    {
        AgentTraceDocument document = new();

        document.Id.Should().BeEmpty();
        document.TraceJson.Should().Be("{}");
        document.Ttl.Should().BeNull();

        document.Id = "doc-1";
        document.RunId = "run-1";
        document.TaskId = "task-1";
        document.CreatedUtc = "2026-07-26T00:00:00Z";
        document.TraceJson = """{"steps":[]}""";
        document.Ttl = 3600;

        document.Id.Should().Be("doc-1");
        document.RunId.Should().Be("run-1");
        document.TaskId.Should().Be("task-1");
        document.TraceJson.Should().Be("""{"steps":[]}""");
        document.Ttl.Should().Be(3600);
    }

    [Fact]
    public void GraphSnapshotDocument_DefaultsAndPropertyAssignment()
    {
        GraphSnapshotDocument document = new();

        document.NodesJson.Should().Be("[]");
        document.EdgesJson.Should().Be("[]");
        document.WarningsJson.Should().Be("[]");

        document.GraphSnapshotId = "gs-1";
        document.ContextSnapshotId = "cs-1";
        document.RunId = "run-1";
        document.SchemaVersion = 2;
        document.NodesJson = """[{"id":"n1"}]""";

        document.GraphSnapshotId.Should().Be("gs-1");
        document.ContextSnapshotId.Should().Be("cs-1");
        document.SchemaVersion.Should().Be(2);
        document.NodesJson.Should().Be("""[{"id":"n1"}]""");
    }

    [Fact]
    public void HostLeaderLeaseSnapshot_DefaultsAndPropertyAssignment()
    {
        HostLeaderLeaseSnapshot defaultSnapshot = new();

        defaultSnapshot.LeaseName.Should().BeEmpty();
        defaultSnapshot.HolderInstanceId.Should().BeEmpty();

        DateTime expiresUtc = new(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);
        HostLeaderLeaseSnapshot snapshot = new()
        {
            LeaseName = "primary-scheduler",
            HolderInstanceId = "instance-a",
            LeaseExpiresUtc = expiresUtc,
        };

        snapshot.LeaseName.Should().Be("primary-scheduler");
        snapshot.HolderInstanceId.Should().Be("instance-a");
        snapshot.LeaseExpiresUtc.Should().Be(expiresUtc);
    }

    [Fact]
    public async Task CachingFindingsSnapshotRepository_GetByIdAsync_UsesHotPathCache()
    {
        Mock<IFindingsSnapshotRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid findingsSnapshotId = Guid.NewGuid();
        FindingsSnapshot expected = new() { FindingsSnapshotId = findingsSnapshotId };

        cache.Setup(c => c.GetOrCreateAsync(
                HotPathCacheKeys.FindingsSnapshot(scope, findingsSnapshotId),
                It.IsAny<Func<CancellationToken, Task<FindingsSnapshot?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ReturnsAsync(expected);

        CachingFindingsSnapshotRepository repository = new(inner.Object, cache.Object, scopeProvider.Object);

        FindingsSnapshot? actual = await repository.GetByIdAsync(scope, findingsSnapshotId, CancellationToken.None);

        actual.Should().BeSameAs(expected);
        inner.Verify(
            i => i.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CachingFindingsSnapshotRepository_SaveAsync_EvictsCacheEntry_WhenNoConnectionSupplied()
    {
        Mock<IFindingsSnapshotRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        FindingsSnapshot snapshot = new() { FindingsSnapshotId = Guid.NewGuid() };

        inner.Setup(i => i.SaveAsync(snapshot, It.IsAny<CancellationToken>(), null, null)).Returns(Task.CompletedTask);
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);
        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        CachingFindingsSnapshotRepository repository = new(inner.Object, cache.Object, scopeProvider.Object);

        await repository.SaveAsync(snapshot, CancellationToken.None);

        cache.Verify(
            c => c.RemoveAsync(
                HotPathCacheKeys.FindingsSnapshot(scope, snapshot.FindingsSnapshotId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CachingFindingsSnapshotRepository_SaveAsync_SkipsEviction_WhenConnectionSupplied()
    {
        Mock<IFindingsSnapshotRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IDbConnection> connection = new();
        FindingsSnapshot snapshot = new() { FindingsSnapshotId = Guid.NewGuid() };

        inner.Setup(i => i.SaveAsync(snapshot, It.IsAny<CancellationToken>(), connection.Object, null))
            .Returns(Task.CompletedTask);

        CachingFindingsSnapshotRepository repository = new(inner.Object, cache.Object, scopeProvider.Object);

        await repository.SaveAsync(snapshot, CancellationToken.None, connection.Object);

        cache.Verify(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        scopeProvider.Verify(p => p.GetCurrentScope(), Times.Never);
    }

    private static EmailMessage CreateMessage()
    {
        return new EmailMessage
        {
            To = "recipient@example.com",
            Subject = "Subject",
            HtmlBody = "<p>Body</p>",
            IdempotencyKey = Guid.NewGuid().ToString("N"),
        };
    }
}
