using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>INV-010: central HTTP clients via IHttpClientFactory (see docs/library/ARCHITECTURE_INVARIANTS.md).</summary>
internal static class Arch004Descriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "ARCH004",
        title: "INV-010 Central HTTP Clients",
        messageFormat: "INV-010: do not construct HttpClient with 'new'; use IHttpClientFactory or a registered typed client under the central HTTP pipeline.",
        category: "ArchLucid.Architecture",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Raw HttpClient construction bypasses factory lifetime and resilience configuration.");

    internal static Diagnostic Create(Location location) =>
        Diagnostic.Create(Rule, location);
}
