using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Findings;

/// <summary>Denormalized RLS scope triple read from a snapshot header before relational backfill.</summary>
[ExcludeFromCodeCoverage(Justification = "Dapper row-mapping DTO with no logic.")]
internal sealed record FindingsSnapshotScopeTripleRow(Guid? TenantId, Guid? WorkspaceId, Guid? ProjectId);
