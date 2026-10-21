namespace ArchLucid.Api.Validation;

/// <summary>
///     Opts a request property out of <see cref="ApiRequestNullCollectionElementsGuard" /> traversal
///     (rare — prefer fixing the DTO shape).
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class SkipNullCollectionElementValidationAttribute : Attribute;
