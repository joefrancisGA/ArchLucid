using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Tests.Architecture;

internal static class ArchitectureIdentityServiceTestDoubles
{
    internal sealed class NoOp : IArchitectureIdentityService
    {
        public Task<ArchitectureIdentityRecord?> EnsureCreatedRunIdentityAsync(
            ScopeContext scope,
            Guid runId,
            string? knowledgeModelId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<ArchitectureIdentityRecord?>(null);

        public Task<ArchitectureIdentityRecord?> EnsureForDraftAsync(
            ScopeContext scope,
            Guid draftId,
            string? displayName,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<ArchitectureIdentityRecord?>(null);

        public Task<bool> TryLinkRunToArchitectureAsync(
            ScopeContext scope,
            Guid runId,
            Guid architectureId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task<ArchitectureIdentityRecord?> TryEnsureReviewRunLinkedAsync(
            ScopeContext scope,
            Guid reviewRunId,
            ArchitectureRequest request,
            string? knowledgeModelId = null,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<ArchitectureIdentityRecord?>(null);
    }

    public static IArchitectureIdentityService NoOpInstance { get; } = new NoOp();
}
