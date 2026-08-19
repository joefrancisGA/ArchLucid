using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>API controllers must declare authorization intent with <c>[Authorize]</c> or <c>[AllowAnonymous]</c> on the type or each public action.</summary>
internal static class Al0001Descriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "AL0001",
        title: "API controller requires authorization attributes",
        messageFormat: "'{0}' must use [Authorize] or [AllowAnonymous] at the controller level (including a base type) or on this public action.",
        category: "ArchLucid.Security",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        description: "Controllers inheriting ControllerBase must declare authorization explicitly so endpoints are not secured by accident.");

    internal static Diagnostic Create(Location location, string symbolDisplayName) =>
        Diagnostic.Create(Rule, location, symbolDisplayName);
}
