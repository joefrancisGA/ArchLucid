using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>ADR 0037 Layer D: tenant-scoped persistence SQL must be scope-bound (see ADR 0047).</summary>
internal static class Arch006Descriptor
{
    internal const string UnscopedTableId = "ARCH006";
    internal const string UnanalyzableSqlId = "ARCH006a";
    internal const string EmptyExemptionJustificationId = "ARCH006b";

    internal static DiagnosticDescriptor UnscopedTableRule { get; } = new(
        id: UnscopedTableId,
        title: "Tenant-scoped persistence query must be scope-bound",
        messageFormat: "Tenant-scoped table '{0}' is queried without a recognized scope predicate, scope-join helper, or [TenantScopeExempt].",
        category: "ArchLucid.Security",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Persistence SQL against scope-triple-on-row or tenant-id-on-row tables must include tenant scope predicates, RunChildRunScopeSql / RepositoryScopePredicate helpers, or an explicit exemption.");

    internal static DiagnosticDescriptor UnanalyzableSqlRule { get; } = new(
        id: UnanalyzableSqlId,
        title: "Tenant-scoped persistence SQL is not statically analyzable",
        messageFormat: "SQL for tenant-scoped table '{0}' is not statically analyzable; use a scope helper constant or [TenantScopeExempt].",
        category: "ArchLucid.Security",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Dynamic or interpolated SQL against tenant-scoped tables must use recognized scope helpers or an explicit exemption.");

    internal static DiagnosticDescriptor EmptyExemptionJustificationRule { get; } = new(
        id: EmptyExemptionJustificationId,
        title: "TenantScopeExempt justification must be non-empty",
        messageFormat: "[TenantScopeExempt] on '{0}' requires a non-empty justification string.",
        category: "ArchLucid.Security",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Tenant scope exemptions must document why repository SQL is intentionally unscoped.");

    internal static Diagnostic CreateUnscopedTable(Location location, string tableName) =>
        Diagnostic.Create(UnscopedTableRule, location, tableName);

    internal static Diagnostic CreateUnanalyzableSql(Location location, string tableName) =>
        Diagnostic.Create(UnanalyzableSqlRule, location, tableName);

    internal static Diagnostic CreateEmptyExemptionJustification(Location location, string targetDisplay) =>
        Diagnostic.Create(EmptyExemptionJustificationRule, location, targetDisplay);
}
