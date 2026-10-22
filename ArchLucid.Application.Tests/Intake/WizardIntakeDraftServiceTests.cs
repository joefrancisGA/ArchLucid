using ArchLucid.Application.Intake;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Intake;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class WizardIntakeDraftServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetAsync_returns_null_when_no_draft_exists()
    {
        WizardIntakeDraftService service = CreateService(new InMemoryWizardIntakeDraftRepository(), out _);

        WizardIntakeDraftResponse? draft = await service.GetAsync(TestScope, "wizard-1", CancellationToken.None);

        draft.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_then_GetAsync_round_trips_draft_for_scope()
    {
        InMemoryWizardIntakeDraftRepository repository = new();
        WizardIntakeDraftService service = CreateService(repository, out FakeTimeProvider timeProvider);
        DateTimeOffset now = new(2026, 8, 31, 12, 0, 0, TimeSpan.Zero);
        timeProvider.SetUtcNow(now);

        WizardIntakeDraftResponse upserted = await service.UpsertAsync(
            TestScope,
            " wizard-1 ",
            new UpsertWizardIntakeDraftRequest { StepIndex = 2, StateJson = "{\"a\":1}", IdempotencyKey = " key-1 " },
            CancellationToken.None);

        upserted.WizardId.Should().Be("wizard-1");
        upserted.StepIndex.Should().Be(2);
        upserted.StateJson.Should().Be("{\"a\":1}");
        upserted.UpdatedUtc.Should().Be(now.UtcDateTime);

        WizardIntakeDraftResponse? fetched = await service.GetAsync(TestScope, "wizard-1", CancellationToken.None);

        fetched.Should().NotBeNull();
        fetched!.WizardId.Should().Be("wizard-1");
        fetched.StepIndex.Should().Be(2);
        fetched.StateJson.Should().Be("{\"a\":1}");
        fetched.UpdatedUtc.Should().Be(now.UtcDateTime);
    }

    [Fact]
    public async Task GetAsync_does_not_return_drafts_from_other_tenants()
    {
        InMemoryWizardIntakeDraftRepository repository = new();
        WizardIntakeDraftService service = CreateService(repository, out _);

        await service.UpsertAsync(
            TestScope,
            "wizard-1",
            new UpsertWizardIntakeDraftRequest { StepIndex = 1, StateJson = "{}" },
            CancellationToken.None);

        ScopeContext otherScope = new()
        {
            TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            WorkspaceId = TestScope.WorkspaceId,
            ProjectId = TestScope.ProjectId,
        };

        WizardIntakeDraftResponse? fetched = await service.GetAsync(otherScope, "wizard-1", CancellationToken.None);

        fetched.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_replaces_existing_draft_for_same_scope_and_wizard()
    {
        InMemoryWizardIntakeDraftRepository repository = new();
        WizardIntakeDraftService service = CreateService(repository, out _);

        await service.UpsertAsync(
            TestScope,
            "wizard-1",
            new UpsertWizardIntakeDraftRequest { StepIndex = 1, StateJson = "{\"v\":1}" },
            CancellationToken.None);

        WizardIntakeDraftResponse updated = await service.UpsertAsync(
            TestScope,
            "wizard-1",
            new UpsertWizardIntakeDraftRequest { StepIndex = 3, StateJson = "{\"v\":2}" },
            CancellationToken.None);

        updated.StepIndex.Should().Be(3);

        WizardIntakeDraftResponse? fetched = await service.GetAsync(TestScope, "wizard-1", CancellationToken.None);

        fetched!.StepIndex.Should().Be(3);
        fetched.StateJson.Should().Be("{\"v\":2}");
    }

    [Fact]
    public async Task UpsertAsync_without_idempotency_key_still_persists()
    {
        InMemoryWizardIntakeDraftRepository repository = new();
        WizardIntakeDraftService service = CreateService(repository, out _);

        WizardIntakeDraftResponse upserted = await service.UpsertAsync(
            TestScope,
            "wizard-2",
            new UpsertWizardIntakeDraftRequest { StepIndex = 0, StateJson = "{}" },
            CancellationToken.None);

        upserted.WizardId.Should().Be("wizard-2");

        WizardIntakeDraftResponse? fetched = await service.GetAsync(TestScope, "wizard-2", CancellationToken.None);

        fetched.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAsync_rejects_blank_wizard_id()
    {
        WizardIntakeDraftService service = CreateService(new InMemoryWizardIntakeDraftRepository(), out _);

        Func<Task> act = () => service.GetAsync(TestScope, "   ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task UpsertAsync_rejects_null_request()
    {
        WizardIntakeDraftService service = CreateService(new InMemoryWizardIntakeDraftRepository(), out _);

        Func<Task> act = () => service.UpsertAsync(TestScope, "wizard-1", null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    private static WizardIntakeDraftService CreateService(
        IWizardIntakeDraftRepository repository,
        out FakeTimeProvider timeProvider)
    {
        FakeTimeProvider fakeTime = new();
        timeProvider = fakeTime;

        return new WizardIntakeDraftService(repository, fakeTime);
    }
}
