using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="IEvidenceBundleRepository" /> for tests (JSON clone-on-read).
/// </summary>
public sealed class InMemoryEvidenceBundleRepository : IEvidenceBundleRepository
{
    private readonly record struct RunBinding(Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid RunId);
    private sealed record StoredBundle(EvidenceBundle Bundle, RunBinding? Binding);

    private readonly Dictionary<string, StoredBundle> _byId = new(StringComparer.Ordinal);
    private readonly Lock _gate = new();

    /// <inheritdoc />
    public Task CreateAsync(
        EvidenceBundle evidenceBundle,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
        => CreateCoreAsync(evidenceBundle, null, cancellationToken);

    public Task CreateForRunAsync(EvidenceBundle evidenceBundle, ScopeContext scope, Guid runId,
        CancellationToken cancellationToken = default, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        if (CreateBinding(scope, runId, evidenceBundle.EvidenceBundleId) is not RunBinding binding)
            throw new ArgumentException("A complete scope, run and bundle ID are required for deferred evidence binding.");

        return CreateCoreAsync(evidenceBundle, binding, cancellationToken);
    }

    private Task CreateCoreAsync(EvidenceBundle evidenceBundle, RunBinding? binding, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            if (_byId.ContainsKey(evidenceBundle.EvidenceBundleId))
                throw new InvalidOperationException(
                    $"Evidence bundle '{evidenceBundle.EvidenceBundleId}' already exists.");

            _byId.Add(evidenceBundle.EvidenceBundleId, new StoredBundle(Clone(evidenceBundle), binding));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<EvidenceBundle?> GetByIdAsync(string evidenceBundleId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)

            return Task.FromResult(_byId.TryGetValue(evidenceBundleId, out StoredBundle? b) ? Clone(b.Bundle) : null);
    }

    public Task<bool> IsBoundToRunAsync(ScopeContext scope, Guid runId, string evidenceBundleId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            return Task.FromResult(CreateBinding(scope, runId, evidenceBundleId) is RunBinding binding &&
                _byId.TryGetValue(evidenceBundleId, out StoredBundle? b) && b.Binding == binding);
        }
    }

    public Task<EvidenceBundle?> GetForRunAsync(ScopeContext scope, Guid runId, string evidenceBundleId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            return Task.FromResult(CreateBinding(scope, runId, evidenceBundleId) is RunBinding binding &&
                _byId.TryGetValue(evidenceBundleId, out StoredBundle? b) && b.Binding == binding ? Clone(b.Bundle) : null);
        }
    }

    /// <inheritdoc />
    public Task UpdateAsync(
        EvidenceBundle evidenceBundle,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)

        {
            if (!_byId.TryGetValue(evidenceBundle.EvidenceBundleId, out StoredBundle? current))
                throw new InvalidOperationException(
                    $"Evidence bundle '{evidenceBundle.EvidenceBundleId}' was not found for update.");

            _byId[evidenceBundle.EvidenceBundleId] = current with { Bundle = Clone(evidenceBundle) };
        }

        return Task.CompletedTask;
    }

    private static RunBinding? CreateBinding(ScopeContext scope, Guid runId, string evidenceBundleId) =>
        CommittedRunEvidenceBinding.HasExplicitScope(scope) && runId != Guid.Empty && !string.IsNullOrWhiteSpace(evidenceBundleId)
            ? new RunBinding(scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId)
            : null;

    private static EvidenceBundle Clone(EvidenceBundle source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        EvidenceBundle? copy = JsonSerializer.Deserialize<EvidenceBundle>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null EvidenceBundle.");
    }
}
