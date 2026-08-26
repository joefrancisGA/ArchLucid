using ArchLucid.ContextIngestion.Parsing;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Deterministic <see cref="ArchLucid.Contracts.Persistence.Context.CanonicalObject.ObjectId" />
///     values for infrastructure declaration parsers.
/// </summary>
public static class InfrastructureDeclarationStableObjectIds
{
    public static string ForDeclaredResource(
        string declarationId,
        string objectType,
        string resourceIdentity)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(declarationId);
        ArgumentException.ThrowIfNullOrWhiteSpace(objectType);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceIdentity);

        return ContextIngestionStableLineNames.StableObjectId(
            objectType,
            $"{declarationId}|{resourceIdentity}");
    }
}
