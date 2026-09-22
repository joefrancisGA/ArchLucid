namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>A type that depends on an authority namespace from a guarded capability cluster.</summary>
internal sealed record ProductCapabilityNamespaceViolation(string TypeName, string ForbiddenPrefix);
