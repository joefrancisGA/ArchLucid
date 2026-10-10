using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Identifies a grant independently of the diagram endpoints that represent its scope and principal.</summary>
internal static class AzureInventoryRoleAssignmentIdentity
{
    public static string Create(string principalId, string scope, string roleDefinitionId) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new[]
        {
            principalId.Trim().ToLowerInvariant(),
            ArmResourceIdNormalizer.Normalize(scope).ToLowerInvariant(),
            NormalizeRole(roleDefinitionId),
        }))));

    public static string NormalizeRole(string roleDefinitionId) => roleDefinitionId.Trim().ToLowerInvariant();
}
