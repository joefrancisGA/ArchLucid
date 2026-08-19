namespace ArchLucid.Core.Audit;

/// <summary>
///     Marks an enclosing method as using best-effort audit per INV-003: failures should not be treated as
///     transactional contract failures (contrast with synchronous governance paths that await
///     <see cref="IAuditService" /> directly).
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Constructor, Inherited = false)]
public sealed class InformationalAuditAttribute : Attribute;
