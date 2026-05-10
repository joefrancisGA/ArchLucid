using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>INV-008: public async boundaries forward CancellationToken (see docs/library/ARCHITECTURE_INVARIANTS.md).</summary>
internal static class Arch003Descriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "ARCH003",
        title: "INV-008 Cancellation Forwarding",
        messageFormat: "INV-008: public service method '{0}' returns a task but has no CancellationToken parameter; add one and forward it to I/O.",
        category: "ArchLucid.Architecture",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Public methods on I*Service interfaces that return Task or Task<T> should accept CancellationToken for cooperative cancellation.");

    internal static Diagnostic Create(Location location, string methodDisplay) =>
        Diagnostic.Create(Rule, location, methodDisplay);
}
