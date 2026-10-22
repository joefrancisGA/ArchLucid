using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>INV-014: no mutable statics in Application / AgentRuntime (see docs/library/ARCHITECTURE_INVARIANTS.md).</summary>
internal static class Arch005Descriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "ARCH005",
        title: "INV-014 No Mutable Statics",
        messageFormat: "INV-014: mutable static '{0}' is not allowed in this assembly; move shared state to DI with an explicit lifetime.",
        category: "ArchLucid.Architecture",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "ArchLucid.Application and ArchLucid.AgentRuntime must not use mutable static fields or static properties with public/internal setters.");

    internal static Diagnostic Create(Location location, string symbolDisplay) =>
        Diagnostic.Create(Rule, location, symbolDisplay);
}
