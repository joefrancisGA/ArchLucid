using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;
[Trait("Category", "Unit")]

/// <summary>
///     Shared contract assertions for <see cref="IEvidenceBundleRepository" />.
/// </summary>
public abstract class EvidenceBundleRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IEvidenceBundleRepository CreateRepository();

    [SkippableFact]
    public async Task Deferred_bundle_binding_rejects_foreign_run_and_scope_and_survives_content_updates()
    {
        SkipIfSqlServerUnavailable();
        IEvidenceBundleRepository repo = CreateRepository();
        ScopeContext owner = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid run = Guid.NewGuid();
        EvidenceBundle bound = new() { EvidenceBundleId = "bound-" + Guid.NewGuid().ToString("N"), RequestDescription = "before" };
        EvidenceBundle legacy = new() { EvidenceBundleId = "legacy-" + Guid.NewGuid().ToString("N") };
        legacy.Metadata["deferredRunBindingV1"] = run.ToString("D");
        await repo.CreateForRunAsync(bound, owner, run);
        await repo.CreateAsync(legacy);

        (await repo.IsBoundToRunAsync(owner, run, bound.EvidenceBundleId)).Should().BeTrue();
        (await repo.GetForRunAsync(owner, run, bound.EvidenceBundleId))!.RequestDescription.Should().Be("before");
        (await repo.IsBoundToRunAsync(owner, run, legacy.EvidenceBundleId)).Should().BeFalse();
        (await repo.GetForRunAsync(owner, run, legacy.EvidenceBundleId)).Should().BeNull();
        (await repo.GetByIdAsync(legacy.EvidenceBundleId)).Should().NotBeNull();

        foreach ((ScopeContext scope, Guid requestedRun) in new[]
                 {
                     (owner, Guid.NewGuid()),
                     (new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = owner.WorkspaceId, ProjectId = owner.ProjectId }, run),
                     (new ScopeContext { TenantId = owner.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = owner.ProjectId }, run),
                     (new ScopeContext { TenantId = owner.TenantId, WorkspaceId = owner.WorkspaceId, ProjectId = Guid.NewGuid() }, run),
                 })
        {
            (await repo.IsBoundToRunAsync(scope, requestedRun, bound.EvidenceBundleId)).Should().BeFalse();
            (await repo.GetForRunAsync(scope, requestedRun, bound.EvidenceBundleId)).Should().BeNull();
        }

        EvidenceBundle updated = new() { EvidenceBundleId = bound.EvidenceBundleId, RequestDescription = "after" };
        await repo.UpdateAsync(updated);
        (await repo.IsBoundToRunAsync(owner, run, bound.EvidenceBundleId)).Should().BeTrue();
        (await repo.GetForRunAsync(owner, run, bound.EvidenceBundleId))!.RequestDescription.Should().Be("after");
        (await repo.GetByIdAsync(bound.EvidenceBundleId))!.RequestDescription.Should().Be("after");
    }

    [SkippableFact]
    public async Task Existing_bundle_cannot_be_reassigned_by_duplicate_create()
    {
        SkipIfSqlServerUnavailable();
        IEvidenceBundleRepository repo = CreateRepository();
        ScopeContext owner = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        ScopeContext foreign = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid run = Guid.NewGuid(), foreignRun = Guid.NewGuid();
        EvidenceBundle bundle = new() { EvidenceBundleId = "immutable-" + Guid.NewGuid().ToString("N"), RequestDescription = "original" };
        await repo.CreateForRunAsync(bundle, owner, run);
        EvidenceBundle replacement = new() { EvidenceBundleId = bundle.EvidenceBundleId, RequestDescription = "replacement" };
        Func<Task> reassign = () => repo.CreateForRunAsync(replacement, foreign, foreignRun);
        await reassign.Should().ThrowAsync<Exception>();
        (await repo.GetForRunAsync(foreign, foreignRun, bundle.EvidenceBundleId)).Should().BeNull();
        (await repo.GetForRunAsync(owner, run, bundle.EvidenceBundleId))!.RequestDescription.Should().Be("original");
    }

    [SkippableFact]
    public async Task Create_then_GetById_round_trips()
    {
        SkipIfSqlServerUnavailable();
        IEvidenceBundleRepository repo = CreateRepository();
        EvidenceBundle bundle = new()
        {
            EvidenceBundleId = "eb-" + Guid.NewGuid().ToString("N"),
            RequestDescription = "rd"
        };

        await repo.CreateAsync(bundle, CancellationToken.None);

        EvidenceBundle? loaded = await repo.GetByIdAsync(bundle.EvidenceBundleId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.EvidenceBundleId.Should().Be(bundle.EvidenceBundleId);
        loaded.RequestDescription.Should().Be("rd");
    }

    [SkippableFact]

    public async Task Update_overwrites_json_at_same_id()
    {
        SkipIfSqlServerUnavailable();
        IEvidenceBundleRepository repo = CreateRepository();
        EvidenceBundle bundle = new()
        {
            EvidenceBundleId = "eb-upd-" + Guid.NewGuid().ToString("N"),
            RequestDescription = "before"
        };

        await repo.CreateAsync(bundle, CancellationToken.None);


        bundle.RequestDescription = "after";

        bundle.Metadata["k"] = "v";


        await repo.UpdateAsync(bundle, CancellationToken.None);


        EvidenceBundle? loaded = await repo.GetByIdAsync(bundle.EvidenceBundleId, CancellationToken.None);

        loaded.Should().NotBeNull();

        loaded.RequestDescription.Should().Be("after");

        loaded.Metadata["k"].Should().Be("v");

    }

    [SkippableFact]

    public async Task Update_absent_bundle_throws()
    {
        SkipIfSqlServerUnavailable();
        IEvidenceBundleRepository repo = CreateRepository();
        EvidenceBundle bundle = new()
        {
            EvidenceBundleId = "missing-" + Guid.NewGuid().ToString("N")
        };


        Func<Task> act = () => repo.UpdateAsync(bundle, CancellationToken.None);


        await act.Should().ThrowAsync<InvalidOperationException>();

    }

}
