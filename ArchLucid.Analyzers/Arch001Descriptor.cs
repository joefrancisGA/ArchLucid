using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>INV-001: tenant identity is resolved only at host boundary (see docs/library/ARCHITECTURE_INVARIANTS.md).</summary>
internal static class Arch001Descriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "ARCH001",
        title: "Tenant identity must not be read from ambient HTTP below the host boundary",
        messageFormat: "INV-001: avoid '{0}' here; establish tenant/scope once at the host boundary (e.g. IScopeContextProvider) instead of ambient HTTP or ClaimsPrincipal.",
        category: "ArchLucid.Architecture",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Deeper layers must not use IHttpContextAccessor, HttpContext, or ClaimsPrincipal; use typed scope from IScopeContextProvider and non-HTTP abstractions.");

    internal static Diagnostic Create(Location location, string symbolName) =>
        Diagnostic.Create(Rule, location, symbolName);
}
