namespace ArchLucid.Core;

/// <summary>
///     Raised when inline authority pipeline execution cannot acquire a tenant capacity slot immediately.
/// </summary>
public sealed class AuthorityTenantConcurrencyLimitExceededException(string message) : InvalidOperationException(message);
