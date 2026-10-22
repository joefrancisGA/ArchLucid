using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.TechnologyLedger;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TechnologyLedgerRunCommandServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly string RunId = RunGuid.ToString("N");

    private readonly InMemoryTechnologyLedgerRepository _ledgerRepository = new();
    private readonly Mock<IRunRepository> _runRepository = new();
    private readonly TechnologyLedgerRunCommandService _sut;

    public TechnologyLedgerRunCommandServiceTests()
    {
        _runRepository
            .Setup(static r => r.GetByIdAsync(It.IsAny<ScopeContext>(), RunGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = RunGuid });

        _sut = new TechnologyLedgerRunCommandService(_ledgerRepository, _runRepository.Object, TimeProvider.System);
    }

    [Fact]
    public async Task GetByRunIdAsync_ReturnsRowsOrderedByCreatedUtc()
    {
        DateTime earlier = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime later = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        await _ledgerRepository.AddAsync(CreateEntry("entry-later", TechnologyLedgerRole.ComputeRuntime, earlier.AddHours(1)));
        await _ledgerRepository.AddAsync(CreateEntry("entry-earlier", TechnologyLedgerRole.Messaging, earlier));

        IReadOnlyList<TechnologyLedgerEntry> entries =
            await _sut.GetByRunIdAsync(Scope, RunGuid, CancellationToken.None);

        entries.Select(static e => e.EntryId).Should().Equal("entry-earlier", "entry-later");
    }

    [Fact]
    public async Task PatchEntryAsync_AssumedToChosen_SetsSourceUser()
    {
        TechnologyLedgerEntry entry = CreateEntry(
            "assumed-entry",
            TechnologyLedgerRole.PrimaryDatastore,
            DateTime.UtcNow,
            TechnologyLedgerStatus.Assumed,
            TechnologyLedgerSource.AgentProposed);

        await _ledgerRepository.AddAsync(entry);

        TechnologyLedgerEntry updated = await _sut.PatchEntryAsync(
            Scope,
            RunGuid,
            entry.EntryId,
            new PatchTechnologyLedgerEntryCommand { Status = TechnologyLedgerStatus.Chosen },
            CancellationToken.None);

        updated.Source.Should().Be(TechnologyLedgerSource.User);
        updated.Status.Should().Be(TechnologyLedgerStatus.Chosen);
    }

    [Fact]
    public async Task PatchEntryAsync_SecondChosenForRole_DemotesPriorChosenToAlternative()
    {
        TechnologyLedgerEntry chosen = CreateEntry(
            "chosen-entry",
            TechnologyLedgerRole.IdentityProvider,
            DateTime.UtcNow,
            TechnologyLedgerStatus.Chosen,
            TechnologyLedgerSource.User);

        TechnologyLedgerEntry assumed = CreateEntry(
            "assumed-entry",
            TechnologyLedgerRole.IdentityProvider,
            DateTime.UtcNow.AddMinutes(1),
            TechnologyLedgerStatus.Assumed,
            TechnologyLedgerSource.AgentProposed);

        await _ledgerRepository.AddAsync(chosen);
        await _ledgerRepository.AddAsync(assumed);

        await _sut.PatchEntryAsync(
            Scope,
            RunGuid,
            assumed.EntryId,
            new PatchTechnologyLedgerEntryCommand { Status = TechnologyLedgerStatus.Chosen },
            CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> rows =
            await _ledgerRepository.GetByRunIdAsync(Scope, RunId, CancellationToken.None);

        rows.Single(static r => r.EntryId == "chosen-entry").Status.Should().Be(TechnologyLedgerStatus.Alternative);
        rows.Single(static r => r.EntryId == "assumed-entry").Status.Should().Be(TechnologyLedgerStatus.Chosen);
    }

    [Fact]
    public async Task PatchEntryAsync_LockedRow_RejectsStatusChange()
    {
        TechnologyLedgerEntry entry = CreateEntry(
            "locked-entry",
            TechnologyLedgerRole.CloudPlatform,
            DateTime.UtcNow,
            TechnologyLedgerStatus.Chosen,
            TechnologyLedgerSource.User,
            isLocked: true);

        await _ledgerRepository.AddAsync(entry);

        Func<Task> act = () => _sut.PatchEntryAsync(
            Scope,
            RunGuid,
            entry.EntryId,
            new PatchTechnologyLedgerEntryCommand { Status = TechnologyLedgerStatus.Alternative },
            CancellationToken.None);

        await act.Should().ThrowAsync<TechnologyLedgerPatchValidationException>();
    }

    [Fact]
    public async Task PatchEntryAsync_LockedRow_AllowsUnlockAndRationaleUpdate()
    {
        TechnologyLedgerEntry entry = CreateEntry(
            "locked-entry",
            TechnologyLedgerRole.Region,
            DateTime.UtcNow,
            TechnologyLedgerStatus.Chosen,
            TechnologyLedgerSource.User,
            isLocked: true);

        await _ledgerRepository.AddAsync(entry);

        TechnologyLedgerEntry updated = await _sut.PatchEntryAsync(
            Scope,
            RunGuid,
            entry.EntryId,
            new PatchTechnologyLedgerEntryCommand
            {
                IsLocked = false,
                Rationale = "Operator clarified region choice.",
            },
            CancellationToken.None);

        updated.IsLocked.Should().BeFalse();
        updated.Rationale.Should().Be("Operator clarified region choice.");
        updated.Status.Should().Be(TechnologyLedgerStatus.Chosen);
    }

    [Fact]
    public async Task PatchEntryAsync_MissingEntry_ThrowsNotFound()
    {
        Func<Task> act = () => _sut.PatchEntryAsync(
            Scope,
            RunGuid,
            "missing-entry",
            new PatchTechnologyLedgerEntryCommand { Rationale = "noop" },
            CancellationToken.None);

        await act.Should().ThrowAsync<TechnologyLedgerEntryNotFoundException>();
    }

    private TechnologyLedgerEntry CreateEntry(
        string entryId,
        TechnologyLedgerRole role,
        DateTime createdUtc,
        TechnologyLedgerStatus status = TechnologyLedgerStatus.Chosen,
        TechnologyLedgerSource source = TechnologyLedgerSource.User,
        bool isLocked = false) =>
        new()
        {
            EntryId = entryId,
            RunId = RunId,
            Role = role,
            TechnologyName = "Example Technology",
            ProviderFamily = CloudProvider.Azure,
            Status = status,
            Source = source,
            IsLocked = isLocked,
            CreatedUtc = createdUtc,
            UpdatedUtc = createdUtc,
        };
}
