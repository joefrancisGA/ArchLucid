namespace ArchLucid.Api.Tests;

/// <summary>Result of <c>POST …/compare/end-to-end/summary</c> with <c>persist: true</c>.</summary>
public readonly record struct PersistedComparison(string ComparisonRecordId);
