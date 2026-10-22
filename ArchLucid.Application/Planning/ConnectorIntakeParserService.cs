using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public sealed partial class ConnectorIntakeParserService(IGitTerraformContentFetcher gitTerraformContentFetcher)
    : IConnectorIntakeParserService
{
    private static readonly Regex ResourceRegex = new(
        """
        resource\s+"(?<type>[^"]+)"\s+"(?<name>[^"]+)"
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly IGitTerraformContentFetcher _gitTerraformContentFetcher = gitTerraformContentFetcher
        ?? throw new ArgumentNullException(nameof(gitTerraformContentFetcher));

    public async Task<ArchitectureRequest> ParseAsync(ConnectorIntakeRequest input, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        string source = input.Source.Trim();

        if (string.Equals(source, "terraform-show-json", StringComparison.OrdinalIgnoreCase))
            return BuildFromTerraformShowJson(input);

        if (string.Equals(source, "git-terraform", StringComparison.OrdinalIgnoreCase))
            return await BuildFromGitTerraformAsync(input, cancellationToken);

        throw new ArgumentException("Source must be 'terraform-show-json' or 'git-terraform'.", nameof(input));
    }

    private static ArchitectureRequest BuildFromTerraformShowJson(ConnectorIntakeRequest input)
    {
        string json = input.TerraformShowJson?.Trim() ?? string.Empty;

        if (json.Length < 20)
            throw new ArgumentException("TerraformShowJson is required for terraform-show-json intake.", nameof(input));

        using JsonDocument document = JsonDocument.Parse(json);
        int resourceCount = CountTerraformResources(document.RootElement);

        if (resourceCount == 0)
            throw new InvalidOperationException("Terraform state JSON did not contain any importable resources.");

        string systemName = ResolveSystemName(input.SystemName, "TerraformImport");
        string description = ResolveDescription(
            input.Description,
            $"Architecture review request imported from Terraform state ({resourceCount} resources).");

        return BuildRequest(
            systemName,
            description,
            [
                new InfrastructureDeclarationRequest
                {
                    Name = "terraform-state-import",
                    Format = "terraform-show-json",
                    Content = json,
                },
            ],
            resourceCount);
    }

    private async Task<ArchitectureRequest> BuildFromGitTerraformAsync(
        ConnectorIntakeRequest input,
        CancellationToken cancellationToken)
    {
        string repositoryUrl = input.GitRepositoryUrl?.Trim() ?? string.Empty;
        string terraformPath = input.GitTerraformPath?.Trim() ?? string.Empty;
        string branch = input.GitBranch?.Trim() ?? "main";

        if (repositoryUrl.Length == 0)
            throw new ArgumentException("GitRepositoryUrl is required for git-terraform intake.", nameof(input));

        if (terraformPath.Length == 0)
            throw new ArgumentException("GitTerraformPath is required for git-terraform intake.", nameof(input));

        if (!terraformPath.EndsWith(".tf", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("GitTerraformPath must point to a .tf file.", nameof(input));

        string terraformContent = await _gitTerraformContentFetcher.FetchTerraformFileAsync(
            repositoryUrl,
            branch,
            terraformPath,
            cancellationToken);

        MatchCollection matches = ResourceRegex.Matches(terraformContent);
        int resourceCount = matches.Count;

        if (resourceCount == 0)
            throw new InvalidOperationException("Git Terraform file did not contain any resource blocks.");

        (string owner, string repo, _) = GitTerraformContentFetcher.ParseGitHubCoordinates(repositoryUrl, branch, terraformPath);
        string systemName = ResolveSystemName(input.SystemName, $"{repo}-terraform");
        string description = ResolveDescription(
            input.Description,
            $"Architecture review request imported from Git ({owner}/{repo}, {resourceCount} Terraform resources).");

        return BuildRequest(
            systemName,
            description,
            [
                new InfrastructureDeclarationRequest
                {
                    Name = "git-terraform-import",
                    Format = "simple-terraform",
                    Content = terraformContent,
                },
            ],
            resourceCount);
    }

    private static ArchitectureRequest BuildRequest(
        string systemName,
        string description,
        List<InfrastructureDeclarationRequest> declarations,
        int resourceCount)
    {
        CloudProvider cloudProvider = ResolveCloudProviderFromDeclarations(declarations);

        return new ArchitectureRequest
        {
            RequestId = Guid.NewGuid().ToString("N"),
            Description = description,
            SystemName = systemName,
            Environment = "prod",
            CloudProvider = cloudProvider,
            Constraints = [$"Imported {resourceCount} Terraform resources via inbound connector."],
            TopologyHints = ["Review imported Terraform topology against target non-functional requirements."],
            InfrastructureDeclarations = declarations,
        };
    }

    private static CloudProvider ResolveCloudProviderFromDeclarations(
        IEnumerable<InfrastructureDeclarationRequest> declarations)
    {
        bool hasAzure = false;
        bool hasAws = false;
        bool hasGcp = false;

        foreach (InfrastructureDeclarationRequest declaration in declarations)
            InferCloudFamiliesFromDeclaration(declaration, ref hasAzure, ref hasAws, ref hasGcp);

        if (hasAws && !hasAzure && !hasGcp)
            return CloudProvider.Aws;

        if (hasGcp && !hasAzure && !hasAws)
            return CloudProvider.Gcp;

        if (hasAzure && !hasAws && !hasGcp)
            return CloudProvider.Azure;

        return CloudProvider.None;
    }

    private static void InferCloudFamiliesFromDeclaration(
        InfrastructureDeclarationRequest declaration,
        ref bool hasAzure,
        ref bool hasAws,
        ref bool hasGcp)
    {
        if (string.Equals(declaration.Format, "terraform-show-json", StringComparison.OrdinalIgnoreCase))
        {
            InferCloudFamiliesFromTerraformShowJson(declaration.Content, ref hasAzure, ref hasAws, ref hasGcp);

            return;
        }

        if (!string.Equals(declaration.Format, "simple-terraform", StringComparison.OrdinalIgnoreCase))
            return;

        foreach (Match match in ResourceRegex.Matches(declaration.Content))
            ApplyTerraformTypeFamily(match.Groups["type"].Value, ref hasAzure, ref hasAws, ref hasGcp);
    }

    private static void InferCloudFamiliesFromTerraformShowJson(
        string json,
        ref bool hasAzure,
        ref bool hasAws,
        ref bool hasGcp)
    {
        if (string.IsNullOrWhiteSpace(json))
            return;

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);

            if (!document.RootElement.TryGetProperty("values", out JsonElement values))
                return;

            if (values.TryGetProperty("root_module", out JsonElement rootModule))
                CollectTerraformTypeFamiliesFromModule(rootModule, ref hasAzure, ref hasAws, ref hasGcp);
        }
        catch (JsonException)
        {
            return;
        }
    }

    private static void CollectTerraformTypeFamiliesFromModule(
        JsonElement module,
        ref bool hasAzure,
        ref bool hasAws,
        ref bool hasGcp)
    {
        if (module.ValueKind != JsonValueKind.Object)
            return;

        if (module.TryGetProperty("resources", out JsonElement resources) && resources.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement resource in resources.EnumerateArray())
            {
                if (!resource.TryGetProperty("type", out JsonElement typeElement)
                    || typeElement.ValueKind != JsonValueKind.String)
                    continue;

                ApplyTerraformTypeFamily(typeElement.GetString() ?? string.Empty, ref hasAzure, ref hasAws, ref hasGcp);
            }
        }

        if (!module.TryGetProperty("child_modules", out JsonElement childModules)
            || childModules.ValueKind != JsonValueKind.Array)
            return;

        foreach (JsonElement child in childModules.EnumerateArray())
            CollectTerraformTypeFamiliesFromModule(child, ref hasAzure, ref hasAws, ref hasGcp);
    }

    private static void ApplyTerraformTypeFamily(
        string terraformType,
        ref bool hasAzure,
        ref bool hasAws,
        ref bool hasGcp)
    {
        if (terraformType.StartsWith("azurerm_", StringComparison.OrdinalIgnoreCase))
            hasAzure = true;
        else if (terraformType.StartsWith("aws_", StringComparison.OrdinalIgnoreCase))
            hasAws = true;
        else if (terraformType.StartsWith("google_", StringComparison.OrdinalIgnoreCase))
            hasGcp = true;
    }

    private static string ResolveSystemName(string? requested, string fallback)
    {
        string trimmed = requested?.Trim() ?? string.Empty;

        return trimmed.Length >= 2 ? trimmed : fallback;
    }

    private static string ResolveDescription(string? requested, string fallback)
    {
        string trimmed = requested?.Trim() ?? string.Empty;

        if (trimmed.Length >= ArchitectureRequestFieldLimits.MinDescriptionLength)
            return trimmed.Length > ArchitectureRequestFieldLimits.MaxDescriptionLength
                ? trimmed[..ArchitectureRequestFieldLimits.MaxDescriptionLength]
                : trimmed;

        return fallback.Length > ArchitectureRequestFieldLimits.MaxDescriptionLength
            ? fallback[..ArchitectureRequestFieldLimits.MaxDescriptionLength]
            : fallback;
    }

    private static int CountTerraformResources(JsonElement root)
    {
        if (!root.TryGetProperty("values", out JsonElement values))
            return 0;

        return CountModuleResources(values.TryGetProperty("root_module", out JsonElement rootModule) ? rootModule : default);
    }

    private static int CountModuleResources(JsonElement module)
    {
        if (module.ValueKind != JsonValueKind.Object)
            return 0;

        int count = 0;

        if (module.TryGetProperty("resources", out JsonElement resources) && resources.ValueKind == JsonValueKind.Array)
            count += resources.GetArrayLength();

        if (module.TryGetProperty("child_modules", out JsonElement childModules) && childModules.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement child in childModules.EnumerateArray())
                count += CountModuleResources(child);
        }

        return count;
    }
}
