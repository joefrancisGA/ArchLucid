using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models.TechnologyLedger;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TechnologyLedgerControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly Mock<ITechnologyLedgerRunCommandService> _service = new();
    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IAuditService> _audit = new();

    public TechnologyLedgerControllerTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static a => a.GetActor()).Returns("op-display");
    }

    private TechnologyLedgerController BuildSut() =>
        new(
            _service.Object,
            _scopeProvider.Object,
            _actorContext.Object,
            _audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    [Fact]
    public async Task GetTechnologyLedger_ReturnsMappedEntries()
    {
        TechnologyLedgerEntry entry = new()
        {
            EntryId = "entry-1",
            RunId = RunGuid.ToString("N"),
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Microsoft Azure",
            ProviderFamily = CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        _service
            .Setup(static s => s.GetByRunIdAsync(It.IsAny<ScopeContext>(), RunGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        TechnologyLedgerController sut = BuildSut();

        IActionResult result = await sut.GetTechnologyLedger(RunGuid, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TechnologyLedgerListResponse response = ok.Value.Should().BeOfType<TechnologyLedgerListResponse>().Subject;
        response.RunId.Should().Be(RunGuid.ToString("N"));
        response.Entries.Should().ContainSingle();
        response.Entries[0].EntryId.Should().Be("entry-1");
        response.Entries[0].TechnologyName.Should().Be("Microsoft Azure");
    }

    [Fact]
    public async Task PatchTechnologyLedgerEntry_Valid_ReturnsOk_AndAudits()
    {
        TechnologyLedgerEntry updated = new()
        {
            EntryId = "entry-1",
            RunId = RunGuid.ToString("N"),
            Role = TechnologyLedgerRole.PrimaryDatastore,
            TechnologyName = "Azure SQL Database",
            ProviderFamily = CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
            IsLocked = true,
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        _service
            .Setup(static s => s.PatchEntryAsync(
                It.IsAny<ScopeContext>(),
                RunGuid,
                "entry-1",
                It.IsAny<PatchTechnologyLedgerEntryCommand>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        TechnologyLedgerController sut = BuildSut();

        IActionResult result = await sut.PatchTechnologyLedgerEntry(
            RunGuid,
            "entry-1",
            new PatchTechnologyLedgerEntryRequest { IsLocked = true },
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        PatchTechnologyLedgerEntryResponse response =
            ok.Value.Should().BeOfType<PatchTechnologyLedgerEntryResponse>().Subject;

        response.Entry.EntryId.Should().Be("entry-1");
        response.Entry.IsLocked.Should().BeTrue();

        _audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TechnologyLedgerEntryUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PatchTechnologyLedgerEntry_NullBody_ReturnsBadRequest_AndDoesNotAudit()
    {
        TechnologyLedgerController sut = BuildSut();

        IActionResult result = await sut.PatchTechnologyLedgerEntry(
            RunGuid,
            "entry-1",
            null,
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        _audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetTechnologyLedger_RunNotFound_Returns404()
    {
        _service
            .Setup(static s => s.GetByRunIdAsync(It.IsAny<ScopeContext>(), RunGuid, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(RunGuid.ToString("N")));

        TechnologyLedgerController sut = BuildSut();

        IActionResult result = await sut.GetTechnologyLedger(RunGuid, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }
}
