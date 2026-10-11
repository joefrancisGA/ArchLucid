using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Persistence.Architecture;

public sealed class InMemoryInfrastructureDiagramDocumentationDecisionRepository
    : IInfrastructureDiagramDocumentationDecisionRepository
{
    private readonly ConcurrentDictionary<string, InfrastructureDiagramDocumentationDecisionPersistRecord> records = new();

    public Task UpsertAsync(
        InfrastructureDiagramDocumentationDecisionPersistRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        this.records[BuildKey(record.TenantId, record.ScopeId, record.SubjectKind, record.SubjectKey)] = record;
        return Task.CompletedTask;
    }

    public Task<InfrastructureDiagramDocumentationDecisionPersistRecord?> TryGetAsync(
        Guid tenantId,
        Guid scopeId,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        this.records.TryGetValue(BuildKey(tenantId, scopeId, subjectKind, subjectKey), out InfrastructureDiagramDocumentationDecisionPersistRecord? record);
        return Task.FromResult(record);
    }

    public Task<InfrastructureDiagramDocumentationDecisionPersistRecord?> TryGetLatestBySubjectAsync(
        Guid tenantId,
        string diagramFingerprint,
        string subjectKind,
        string subjectKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        InfrastructureDiagramDocumentationDecisionPersistRecord? record = this.records.Values
            .Where(candidate =>
                candidate.TenantId == tenantId
                && string.Equals(candidate.DiagramFingerprint, diagramFingerprint, StringComparison.Ordinal)
                && string.Equals(candidate.SubjectKind, subjectKind, StringComparison.Ordinal)
                && string.Equals(candidate.SubjectKey, subjectKey, StringComparison.Ordinal))
            .OrderByDescending(candidate => candidate.UpdatedUtc)
            .FirstOrDefault();

        return Task.FromResult(record);
    }

    private static string BuildKey(Guid tenantId, Guid scopeId, string subjectKind, string subjectKey) =>
        $"{tenantId:D}:{scopeId:D}:{subjectKind}:{subjectKey}";
}
