using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class PresenterIntakeTrailSyncServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task TrySyncDraftTransparencyTrailToSpawnedRunAsync_updates_request_intake_trail()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string requestId = DraftSpawnedArchitectureRequestId.FromDraftId(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

        TransparencyTrail draftTrail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "answer.latency",
                    Value = "Yes",
                    QuestionId = "latency",
                    ResponderLabel = "Room",
                    RecordedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                },
            ],
        };

        InMemoryArchitectureRequestRepository requestRepository = new();
        await requestRepository.CreateAsync(
            new ArchitectureRequest
            {
                RequestId = requestId,
                SystemName = "Platform",
                Environment = "prod",
                Description = "Test platform review.",
                RequestSource = "draft-intake",
                IntakeTransparencyTrail = new TransparencyTrail(),
            },
            CancellationToken.None);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                ArchitectureRequestId = requestId,
            });

        PresenterIntakeTrailSyncService sut = new(runRepository.Object, requestRepository);

        await sut.TrySyncDraftTransparencyTrailToSpawnedRunAsync(
            Scope,
            runId.ToString("D"),
            draftTrail,
            CancellationToken.None);

        ArchitectureRequest? updated = await requestRepository.GetByIdAsync(requestId, CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.IntakeTransparencyTrail.Should().NotBeNull();
        updated.IntakeTransparencyTrail!.Asserted.Should().ContainSingle(entry =>
            entry.Key == "answer.latency"
            && entry.Value == "Yes"
            && entry.QuestionId == "latency"
            && entry.ResponderLabel == "Room");
    }
}
