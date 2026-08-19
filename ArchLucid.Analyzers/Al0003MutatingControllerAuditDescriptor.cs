using Microsoft.CodeAnalysis;

namespace ArchLucid.Analyzers;

/// <summary>POST/PUT/DELETE controller actions must call <c>ArchLucid.Core.Audit.IAuditService.LogAsync</c> (or declare an exemption).</summary>
internal static class Al0003MutatingControllerAuditDescriptor
{
    internal static DiagnosticDescriptor Rule { get; } = new(
        id: "AL0003",
        title: "Mutating controller action must audit via IAuditService",
        messageFormat:
            "Action '{0}' must call ArchLucid.Core.Audit.IAuditService.LogAsync (or appear in AdditionalFiles controller_action_audit_allowlist.txt, or apply [MutatingAuditExcluded]).",
        category: "ArchLucid.Security",
        defaultSeverity: DiagnosticSeverity.Error,
        isEnabledByDefault: true,
        description:
            "POST, PUT, and DELETE endpoints are required to invoke durable auditing on the HTTP surface unless explicitly exempt.");

    internal static Diagnostic Create(Location location, string fqMethodDisplay) =>
        Diagnostic.Create(Rule, location, fqMethodDisplay);
}
