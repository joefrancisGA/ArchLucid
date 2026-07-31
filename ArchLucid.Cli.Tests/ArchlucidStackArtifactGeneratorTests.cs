using ArchLucid.Cli.Stack;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchlucidStackArtifactGeneratorTests
{
    [Fact]
    public void Generate_emits_all_required_artifact_kinds()
    {
        ArchlucidStackDocument document = SampleDocument();
        ArchlucidStackGeneratedArtifacts artifacts = ArchlucidStackArtifactGenerator.Generate(document);

        artifacts.FilesByRelativePath.Should().ContainKeys(
            "terraform-private.tfvars",
            "terraform-container-apps.tfvars",
            "terraform-pilot.tfvars",
            "terraform-keyvault.tfvars",
            "appsettings.Hosted.json",
            "github-environment-variables.json",
            "key-vault-secret-checklist.md");
    }

    [Fact]
    public void Generate_propagates_operator_answers_into_tfvars()
    {
        ArchlucidStackDocument document = SampleDocument();
        ArchlucidStackGeneratedArtifacts artifacts = ArchlucidStackArtifactGenerator.Generate(document);

        string containerApps = artifacts.FilesByRelativePath["terraform-container-apps.tfvars"];

        containerApps.Should().Contain("rg-archlucid-ca-dev");
        containerApps.Should().Contain("acrarchluciddev.azurecr.io/archlucid:2026.07.1");
        containerApps.Should().Contain("eastus2");
    }

    [Fact]
    public void Generate_key_vault_checklist_lists_secret_names_only()
    {
        ArchlucidStackDocument document = SampleDocument();
        ArchlucidStackGeneratedArtifacts artifacts = ArchlucidStackArtifactGenerator.Generate(document);

        string checklist = artifacts.FilesByRelativePath["key-vault-secret-checklist.md"];

        checklist.Should().Contain("archlucid-sql-connection-string");
        checklist.Should().Contain("archlucid-api-admin-key");
        checklist.Should().NotContain("password");
    }

    [Fact]
    public void SchemaValidator_accepts_sample_document()
    {
        ArchlucidStackDocument document = SampleDocument();
        ArchlucidStackSchemaValidator.Evaluation evaluation = ArchlucidStackSchemaValidator.ValidateDocument(document);

        evaluation.IsValid.Should().BeTrue(string.Join("; ", evaluation.Errors));
    }

    [Fact]
    public void Parser_reads_example_yaml_from_repository()
    {
        string? repoRoot = ResolveRepositoryRootFromTestContext();
        repoRoot.Should().NotBeNull();

        string examplePath = Path.Combine(repoRoot!, "deploy", "archlucid.stack.example.yaml");
        File.Exists(examplePath).Should().BeTrue(examplePath);

        ArchlucidStackDocument document = ArchlucidStackDocumentParser.ParseFile(examplePath);
        ArchlucidStackSchemaValidator.Evaluation evaluation = ArchlucidStackSchemaValidator.ValidateDocument(document);

        evaluation.IsValid.Should().BeTrue(string.Join("; ", evaluation.Errors));
    }

    private static string? ResolveRepositoryRootFromTestContext()
    {
        string besideTests = Path.Combine(AppContext.BaseDirectory, "deploy", "archlucid.stack.example.yaml");

        if (File.Exists(besideTests))
            return AppContext.BaseDirectory;

        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        for (int ascent = 0; ascent < 12 && directory is not null; ascent++)
        {
            string candidate = Path.Combine(directory.FullName, "deploy", "archlucid.stack.example.yaml");

            if (File.Exists(candidate))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }

    private static ArchlucidStackDocument SampleDocument()
    {
        return new ArchlucidStackDocument
        {
            SchemaVersion = 1,
            Azure = new ArchlucidStackAzureSection
            {
                SubscriptionId = "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
                TenantId = "00000000-0000-0000-0000-000000000001",
                Location = "eastus2",
                Environment = "dev",
            },
            Naming = new ArchlucidStackNamingSection
            {
                ResourcePrefix = "archlucid",
            },
            ContainerRegistry = new ArchlucidStackContainerRegistrySection
            {
                LoginServer = "acrarchluciddev.azurecr.io",
                ImageTag = "2026.07.1",
            },
            PublicSite = new ArchlucidStackPublicSiteSection
            {
                BaseUrl = "https://app.example.com",
            },
            KeyVault = new ArchlucidStackKeyVaultSection
            {
                Name = "kv-archlucid-dev",
            },
            Deployment = new ArchlucidStackDeploymentSection
            {
                MultiRootApplyOptIn = true,
                PilotMonthlyBudgetUsd = 800,
            },
            OpenAi = new ArchlucidStackOpenAiSection
            {
                ComposeMode = "existing",
                ExistingEndpoint = "https://oai-archlucid-dev.openai.azure.com/",
                ChatDeploymentName = "gpt-5.6-terra",
                EconomyDeploymentName = "gpt-5.6-luna",
                PremiumDeploymentName = "gpt-5.6-sol",
                EmbeddingDeploymentName = "text-embedding-3-small",
            },
            Search = new ArchlucidStackSearchSection
            {
                ComposeMode = "existing",
                ExistingEndpoint = "https://srch-archlucid-dev.search.windows.net",
                IndexName = "archlucid-vectors",
            },
        };
    }
}
