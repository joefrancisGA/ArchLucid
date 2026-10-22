namespace ArchLucid.Api.Validation;

/// <summary>
///     Opts a request property out of <see cref="ApiRequestNullCollectionElementsGuard" /> null-property and null-element checks
///     (rare — prefer fixing the DTO shape).
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class SkipNullCollectionElementValidationAttribute : Attribute;
