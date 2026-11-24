using ArchLucid.Core.Scoping;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Host adapter for the existing architecture read-share decision; never supplied by a request DTO.</summary>
public interface IAskEvidenceAccess
{
    string? GetAuthorizedActorId();
    Task<bool> CanReadRunAsync(ScopeContext scope, Guid runId, CancellationToken ct);
}

/// <summary>Hosts without an authenticated request adapter must not grant Ask evidence access.</summary>
public sealed class DenyUnconfiguredAskEvidenceAccess : IAskEvidenceAccess
{
    public string? GetAuthorizedActorId() => null;
    public Task<bool> CanReadRunAsync(ScopeContext scope, Guid runId, CancellationToken ct) =>
        Task.FromResult(false);
}
