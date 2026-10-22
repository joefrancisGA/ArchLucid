using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using FluentAssertions;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceProductRunSourceContextLoaderTests
{
    [Fact]
    public async Task LoadAsync_maps_description_documents_and_inline_requirements()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ScopeContext scope = CreateScope();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ArchitectureRequestId = "req-1",
                Description = "fallback description",
            });

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest
            {
                RequestId = "req-1",
                Description = "Primary architecture description from request.",
                InlineRequirements = ["Must encrypt PHI at rest"],
                Documents =
                [
                    new ContextDocumentRequest
                    {
                        Name = "adr-001.md",
                        ContentType = "text/markdown",
                        Content = "ADR: no public RDP.",
                    },
                ],
            });

        ArchitectureIntelligenceProductRunSourceContextLoader loader = new(
            scopeProvider.Object,
            runRepository.Object,
            requestRepository.Object);

        ArchitectureIntelligenceProductRunSourceContextLoadResult result =
            await loader.LoadAsync(runId.ToString("D"));

        result.Found.Should().BeTrue();
        result.HasContent.Should().BeTrue();
        result.Request.Should().NotBeNull();
        result.Request!.RunId.Should().Be(runId.ToString("D"));
        result.Request.SourceTexts.Should().HaveCount(3);
        result.Request.SourceTexts[0].Content.Should().Contain("Primary architecture description");
        result.Request.SourceTexts.Should().Contain(source => source.FileName == "inline-requirements.txt");
        result.Request.SourceTexts.Should().Contain(source => source.FileName == "adr-001.md");
    }

    [Fact]
    public async Task LoadAsync_falls_back_to_run_description_when_request_missing()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = CreateScope();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ArchitectureRequestId = null,
                Description = "Run-level description only.",
            });

        ArchitectureIntelligenceProductRunSourceContextLoader loader = new(
            scopeProvider.Object,
            runRepository.Object,
            Mock.Of<IArchitectureRequestRepository>());

        ArchitectureIntelligenceProductRunSourceContextLoadResult result =
            await loader.LoadAsync(runId.ToString("D"));

        result.HasContent.Should().BeTrue();
        result.Request!.SourceTexts.Should().ContainSingle();
        result.Request.SourceTexts[0].Content.Should().Be("Run-level description only.");
    }

    [Fact]
    public async Task LoadAsync_returns_not_found_for_unknown_run()
    {
        ScopeContext scope = CreateScope();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        ArchitectureIntelligenceProductRunSourceContextLoader loader = new(
            scopeProvider.Object,
            runRepository.Object,
            Mock.Of<IArchitectureRequestRepository>());

        ArchitectureIntelligenceProductRunSourceContextLoadResult result =
            await loader.LoadAsync(Guid.NewGuid().ToString("D"));

        result.Found.Should().BeFalse();
        result.HasContent.Should().BeFalse();
    }

    private static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000"),
        };
    }
}
