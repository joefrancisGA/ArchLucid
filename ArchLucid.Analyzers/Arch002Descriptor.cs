using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>INV-007: clock reads use TimeProvider / IClock (see docs/library/ARCHITECTURE_INVARIANTS.md).</summary>
internal static class Arch002Descriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "ARCH002",
        title: "INV-007 Injected Time",
        messageFormat: "INV-007: do not use '{0}' here; obtain time from TimeProvider, IClock, or host-injected abstractions (clock adapters only in allow-listed assemblies).",
        category: "ArchLucid.Architecture",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Production code must not call DateTime/DateTimeOffset UtcNow/Now outside clock adapters and host entry.");

    internal static Diagnostic Create(Location location, string memberDisplay) =>
        Diagnostic.Create(Rule, location, memberDisplay);
}
