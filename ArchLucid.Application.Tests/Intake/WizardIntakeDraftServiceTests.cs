using ArchLucid.Application.Intake;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Intake;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class WizardIntakeDraftServiceTests
{
    private static readonly DateTime UtcNow = new(2026, 8, 31, 12, 0, 0, DateTimeKind.Utc);

    private static ScopeContext ScopeWith(string tenantId, string workspaceId) => new()
    {
        TenantId = Guid.Parse(tenantId),
        WorkspaceId = Guid.Parse(workspaceId)
    };

    private static ScopeContext ScopeA => ScopeWith("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static ScopeContext OtherTenantScope => ScopeWith("dddddddd-dddd-dddd-dddd-dddddddddddd", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static ScopeContext OtherWorkspaceScope => ScopeWith("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private static WizardIntakeDraftService CreateInMemoryService()
    {
        Mock<IArchLucidStorageMode> storageMode = new();
        storageMode.Setup(s => s.IsInMemory).Returns(true);

        return new WizardIntakeDraftService(
            Mock.Of<IDbConnectionFactory>(),
            storageMode.Object,
            new FixedTimeProvider(UtcNow));
    }

    private static UpsertWizardIntakeDraftRequest Request(int stepIndex = 1, string stateJson = "{}") => new()
    {
        StepIndex = stepIndex,
        StateJson = stateJson
    };

    [Fact]
    public async Task GetAsync_returns_null_when_draft_missing()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();

        WizardIntakeDraftResponse? draft = await sut.GetAsync(ScopeA, "wizard-missing", CancellationToken.None);

        draft.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_then_GetAsync_round_trips_draft()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();

        WizardIntakeDraftResponse saved =
            await sut.UpsertAsync(ScopeA, " wizard-1 ", Request(stepIndex: 2, "{\"step\":2}"), CancellationToken.None);
        WizardIntakeDraftResponse? loaded = await sut.GetAsync(ScopeA, "wizard-1", CancellationToken.None);

        saved.WizardId.Should().Be("wizard-1");
        saved.UpdatedUtc.Should().Be(UtcNow);
        loaded.Should().BeEquivalentTo(new WizardIntakeDraftResponse
        {
            WizardId = "wizard-1",
            StepIndex = 2,
            StateJson = "{\"step\":2}",
            UpdatedUtc = UtcNow
        });
    }

    [Fact]
    public async Task GetAsync_does_not_return_draft_from_another_tenant()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();
        await sut.UpsertAsync(ScopeA, "wizard-1", Request(), CancellationToken.None);

        WizardIntakeDraftResponse? crossTenant = await sut.GetAsync(OtherTenantScope, "wizard-1", CancellationToken.None);

        crossTenant.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_does_not_return_draft_from_another_workspace()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();
        await sut.UpsertAsync(ScopeA, "wizard-1", Request(), CancellationToken.None);

        WizardIntakeDraftResponse? crossWorkspace =
            await sut.GetAsync(OtherWorkspaceScope, "wizard-1", CancellationToken.None);

        crossWorkspace.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_keeps_drafts_isolated_per_scope_for_same_wizard_id()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();

        await sut.UpsertAsync(ScopeA, "wizard-1", Request(stepIndex: 1, "{\"scope\":\"a\"}"), CancellationToken.None);
        await sut.UpsertAsync(OtherTenantScope, "wizard-1", Request(stepIndex: 4, "{\"scope\":\"b\"}"), CancellationToken.None);

        WizardIntakeDraftResponse? scopeA = await sut.GetAsync(ScopeA, "wizard-1", CancellationToken.None);
        WizardIntakeDraftResponse? scopeB = await sut.GetAsync(OtherTenantScope, "wizard-1", CancellationToken.None);

        scopeA.Should().NotBeNull();
        scopeA!.StepIndex.Should().Be(1);
        scopeA.StateJson.Should().Be("{\"scope\":\"a\"}");
        scopeB.Should().NotBeNull();
        scopeB!.StepIndex.Should().Be(4);
        scopeB.StateJson.Should().Be("{\"scope\":\"b\"}");
    }

    [Fact]
    public async Task UpsertAsync_overwrites_existing_draft_in_same_scope()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();
        await sut.UpsertAsync(ScopeA, "wizard-1", Request(stepIndex: 1), CancellationToken.None);

        await sut.UpsertAsync(ScopeA, "wizard-1", Request(stepIndex: 5, "{\"step\":5}"), CancellationToken.None);
        WizardIntakeDraftResponse? loaded = await sut.GetAsync(ScopeA, "wizard-1", CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.StepIndex.Should().Be(5);
        loaded.StateJson.Should().Be("{\"step\":5}");
    }

    [Fact]
    public async Task GetAsync_rejects_blank_wizard_id()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();

        Func<Task> act = () => sut.GetAsync(ScopeA, "  ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpsertAsync_rejects_blank_wizard_id()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();

        Func<Task> act = () => sut.UpsertAsync(ScopeA, "", Request(), CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpsertAsync_rejects_null_request()
    {
        WizardIntakeDraftService sut = CreateInMemoryService();

        Func<Task> act = () => sut.UpsertAsync(ScopeA, "wizard-1", null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    private sealed class FixedTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow, TimeSpan.Zero);
    }
}
