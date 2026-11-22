using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryRunRepositoryCreateUniquenessTests
{
    [Fact]
    public async Task Duplicate_run_id_is_rejected_without_overwriting_or_recharging_trial()
    {
        ScopeContext scope = NewScope();
        Mock<ITenantRepository> tenants = TrialTenant(scope.TenantId);
        InMemoryRunRepository repository = new(tenants.Object);
        Guid id = Guid.NewGuid();
        RunRecord original = NewRun(scope, id, "original");
        RunRecord duplicate = NewRun(scope, id, "replacement");

        await repository.SaveAsync(original, CancellationToken.None);
        Func<Task> duplicateInsert = () => repository.SaveAsync(duplicate, CancellationToken.None);
        await duplicateInsert.Should().ThrowAsync<InvalidOperationException>();

        RunRecord? stored = await repository.GetByIdAsync(scope, id, CancellationToken.None);
        stored.Should().NotBeNull();
        stored!.Description.Should().Be("original");
        VerifyQuotaCount(tenants, scope.TenantId, 1);
    }

    [Fact]
    public async Task Concurrent_creates_of_same_run_id_admit_exactly_one_and_charge_once()
    {
        ScopeContext scope = NewScope();
        Mock<ITenantRepository> tenants = TrialTenant(scope.TenantId);
        InMemoryRunRepository repository = new(tenants.Object);
        Guid id = Guid.NewGuid();

        Task<bool>[] calls = Enumerable.Range(0, 24)
            .Select(i => Task.Run(async () =>
            {
                try
                {
                    await repository.SaveAsync(NewRun(scope, id, $"candidate-{i}"), CancellationToken.None);
                    return true;
                }
                catch (InvalidOperationException)
                {
                    return false;
                }
            }))
            .ToArray();

        bool[] outcomes = await Task.WhenAll(calls);
        outcomes.Count(success => success).Should().Be(1);
        (await repository.GetByIdAsync(scope, id, CancellationToken.None)).Should().NotBeNull();
        VerifyQuotaCount(tenants, scope.TenantId, 1);
    }

    [Fact]
    public async Task Failure_to_charge_trial_does_not_insert_run()
    {
        ScopeContext scope = NewScope();
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.TryIncrementActiveTrialRunAsync(
                scope.TenantId, It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(), It.IsAny<IDbTransaction?>()))
            .ThrowsAsync(new InvalidOperationException("trial exhausted"));

        InMemoryRunRepository repository = new(tenants.Object);
        RunRecord input = NewRun(scope, Guid.NewGuid(), "not charged");

        Func<Task> create = () => repository.SaveAsync(input, CancellationToken.None);
        await create.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("trial exhausted");

        (await repository.GetByIdAsync(scope, input.RunId, CancellationToken.None)).Should().BeNull();
    }

    private static Mock<ITenantRepository> TrialTenant(Guid tenantId)
    {
        Mock<ITenantRepository> result = new();
        result.Setup(t => t.TryIncrementActiveTrialRunAsync(
                tenantId, It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(), It.IsAny<IDbTransaction?>()))
            .Returns(Task.CompletedTask);
        return result;
    }

    private static void VerifyQuotaCount(Mock<ITenantRepository> tenants, Guid tenantId, int times) =>
        tenants.Verify(t => t.TryIncrementActiveTrialRunAsync(
                tenantId, It.IsAny<CancellationToken>(),
                It.IsAny<IDbConnection?>(), It.IsAny<IDbTransaction?>()),
            Times.Exactly(times));

    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid()
    };

    private static RunRecord NewRun(ScopeContext scope, Guid id, string description) => new()
    {
        RunId = id,
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ScopeProjectId = scope.ProjectId,
        ProjectId = "aspects-quota",
        Description = description,
        CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
    };
}
