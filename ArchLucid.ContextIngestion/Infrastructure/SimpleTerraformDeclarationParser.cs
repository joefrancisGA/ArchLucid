using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Infrastructure;

public class SimpleTerraformDeclarationParser : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "simple-terraform", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(declaration);
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);

        IReadOnlyList<SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock> blocks =
            SimpleTerraformResourceBlockParser.ExtractBlocks(declaration.Content);

        List<CanonicalObject> results = [];

        foreach (SimpleTerraformResourceBlockParser.SimpleTerraformResourceBlock block in blocks)
        {
            string terraformType = block.TerraformType.Trim();
            string name = block.Name.Trim();

            if (string.IsNullOrWhiteSpace(terraformType) || string.IsNullOrWhiteSpace(name))
                continue;

            string objectType = ResolveObjectType(terraformType);
            string canonicalTerraformType = terraformType.ToLowerInvariant();

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = canonicalTerraformType
            };

            SimpleTerraformResourceBlockParser.ParseBodyIntoProperties(block.Body, properties);

            string canonicalName = name.ToLowerInvariant();

            results.Add(new CanonicalObject
            {
                ObjectId = InfrastructureDeclarationStableObjectIds.ForDeclaredResource(
                    declaration.DeclarationId,
                    objectType,
                    $"{canonicalTerraformType}|{canonicalName}"),
                ObjectType = objectType,
                Name = canonicalName,
                SourceType = "InfrastructureDeclaration",
                SourceId = declaration.DeclarationId,
                Properties = properties
            });
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    private static string ResolveObjectType(string terraformType)
    {
        string normalized = terraformType.ToLowerInvariant();

        if (normalized.Contains("key_vault", StringComparison.Ordinal) ||
            normalized.Contains("firewall", StringComparison.Ordinal) ||
            normalized.Contains("network_security_group", StringComparison.Ordinal) ||
            normalized.Contains("aws_security_group", StringComparison.Ordinal) ||
            normalized.Contains("aws_network_acl", StringComparison.Ordinal) ||
            normalized.Contains("google_compute_firewall", StringComparison.Ordinal))

            return "SecurityBaseline";


        return normalized.Contains("policy", StringComparison.Ordinal) ? "PolicyControl" : "TopologyResource";
    }
}
