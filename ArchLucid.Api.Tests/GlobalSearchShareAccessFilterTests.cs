using System.Security.Claims;

using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Core.Search;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>AS-094: global search omits restricted architecture run/finding titles.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GlobalSearchShareAccessFilterTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid RestrictedArchitectureId =
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private const string SecretRunDescription = "SECRET-RESTRICTED-RUN-AS094";

    private readonly Mock<IArchitectureShareAccessGate> _shareAccessGate = new();

    public GlobalSearchShareAccessFilterTests()
    {
        _shareAccessGate
            .Setup(gate => gate.EvaluateArchitectureAsync(
                It.IsAny<ClaimsPrincipal>(),
                Scope,
                RestrictedArchitectureId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                CanRead = false,
                CanDecide = false,
                CanAdmin = false,
            });

        _shareAccessGate
            .Setup(gate => gate.EvaluateArchitectureAsync(
                It.IsAny<ClaimsPrincipal>(),
                Scope,
                It.Is<Guid>(id => id != RestrictedArchitectureId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = false,
                CanRead = true,
                CanDecide = true,
                CanAdmin = true,
            });
    }

    [Fact]
    public async Task FilterAsync_omits_run_and_finding_hits_for_restricted_architecture()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        GlobalSearchResult input = new()
        {
            Runs =
            [
                new GlobalSearchRunHit
                {
                    RunId = runId,
                    Description = SecretRunDescription,
                    ArchitectureId = RestrictedArchitectureId,
                },
            ],
            Findings =
            [
                new GlobalSearchFindingHit
                {
                    RunId = runId,
                    ArchitectureId = RestrictedArchitectureId,
                    FindingId = "finding-1",
                    Title = "Secret finding",
                    Severity = "High",
                },
            ],
        };

        GlobalSearchShareAccessFilter sut = new(_shareAccessGate.Object);

        GlobalSearchResult filtered = await sut.FilterAsync(
            new ClaimsPrincipal(),
            Scope,
            input,
            CancellationToken.None);

        filtered.Runs.Should().BeEmpty();
        filtered.Findings.Should().BeEmpty();
    }

    [Fact]
    public async Task FilterAsync_keeps_run_hits_without_architecture_link()
    {
        GlobalSearchResult input = new()
        {
            Runs =
            [
                new GlobalSearchRunHit
                {
                    RunId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                    Description = "Legacy run",
                    ArchitectureId = null,
                },
            ],
        };

        GlobalSearchShareAccessFilter sut = new(_shareAccessGate.Object);

        GlobalSearchResult filtered = await sut.FilterAsync(
            new ClaimsPrincipal(),
            Scope,
            input,
            CancellationToken.None);

        filtered.Runs.Should().ContainSingle();
        filtered.Runs[0].Description.Should().Be("Legacy run");
    }
}
