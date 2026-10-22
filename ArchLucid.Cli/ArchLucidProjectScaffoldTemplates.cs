using System.Text.Json;

namespace ArchLucid.Cli;

public static partial class ArchLucidProjectScaffolder
{
    private static string BuildDocsReadme(string projectName)
    {
        return
            $"""
             # {projectName}

             ## Folder layout

             - `archlucid.json` — The single source of truth for project configuration.
             - `inputs/brief.md` — The one thing you can always run (minimal project brief).
             - `outputs/` — Optional local cache of output artifacts (not authoritative). Includes `.gitkeep` to preserve the folder in Git.
             - `plugins/plugin-lock.json` — Pinned plugin images + versions + endpoints.
             - `infra/terraform/` — Optional; stubbed initially (`main.tf`, `variables.tf`).
             - `docs/` — Human documentation for the project.

             ## How to use

             1. Edit `inputs/brief.md`
             2. Update `archlucid.json` if needed
             3. Run `archlucid run` (or your host workflow) against the brief

             """;
    }

    private static string BuildArchLucidJson(string projectName)
    {
        ArchLucidCliConfig config = new()
        {
            ProjectName = projectName,
            ApiUrl = string.Empty,
            Infra =
                new InfraSection { Terraform = new TerraformSection { Enabled = false, Path = "infra/terraform" } },
            Architecture = new ArchitectureSection
            {
                Environment = "prod",
                CloudProvider = "Azure",
                Constraints = ["Private endpoints required", "Use managed identity"],
                RequiredCapabilities = ["Azure AI Search", "SQL", "Managed Identity"],
                Assumptions = ["Moderate query volume", "Internal enterprise usage only"]
            }
        };
        return JsonSerializer.Serialize(config, SJsonManifest) + Environment.NewLine;
    }

    private static string BuildBriefMd(string projectName)
    {
        return
            $@"# {projectName} — ArchLucid Brief

## Goal
Describe the outcome you want (business + technical). Keep it short and runnable.

## Constraints
- Security/compliance requirements:
- Time/budget:
- Data sensitivity:

## Inputs
- Source systems:
- Target environment:
- Key dependencies:

## Outputs
- What artifacts should ArchLucid generate?

## Acceptance Criteria
- What does ""done"" look like?
";
    }

    private static string BuildPluginLockJson()
    {
        const string lockDoc = """
                               {
                                               "schemaVersion": "1.0",
                                               "generatedUtc": "REPLACE_AT_RUNTIME",
                                               "plugins": [
                                                   {
                                                       "name": "example.generator.docs",
                                                       "image": "ghcr.io/your-org/archlucid-plugin-docs",
                                                       "version": "1.0.0",
                                                   "endpoint": "local"
                                                   }
                                               ]
                                           }
                               """;
        return lockDoc.Replace("REPLACE_AT_RUNTIME", TimeProvider.System.UtcNowDateTime().ToString("O")) + Environment.NewLine;
    }

    private static string BuildTerraformMainTf()
    {
        return
            """
            terraform {
              required_version = ">= 1.6.0"
            }

            # provider "azurerm" {
            #   features {}
            # }

            """;
    }

    private static string BuildTerraformVariablesTf()
    {
        return
            """
            # variable "location" {
            #   type        = string
            #   description = "Azure region"
            # }

            """;
    }
}
