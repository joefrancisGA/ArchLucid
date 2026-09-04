using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Stable surrogate key for deterministic in-memory paging (differs from SQL <c>NewGuid()</c> row ids).
/// </summary>
public sealed record FindingKeysetEnvelope(int SortOrder, Guid RecordId, Finding Finding, int? PriorityRank);
