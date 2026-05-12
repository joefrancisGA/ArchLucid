using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>Suggests replacing simple accumulation <c>foreach</c> loops with LINQ and List AddRange.</summary>
internal static class Al0002ForeachToLinqDescriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "AL0002",
        title: "foreach can use LINQ for this accumulation",
        messageFormat: "This foreach can use LINQ ({0}); apply the code fix when the sequence has no observable side-effects per iteration.",
        category: "ArchLucid.Style",
        defaultSeverity: DiagnosticSeverity.Info,
        isEnabledByDefault: true,
        description:
            "Flags foreach loops whose body only pushes into a List<T> with a single projection or conditional add. Use the fix only when reordering LINQ semantics is acceptable.");

    internal static Diagnostic Create(Location location, string kindSummary) =>
        Diagnostic.Create(Rule, location, kindSummary);
}
