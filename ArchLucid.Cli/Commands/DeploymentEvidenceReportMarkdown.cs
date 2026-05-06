using System.Text;

using ArchLucid.Cli.Support;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Support;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Commands;

internal static class DeploymentEvidenceReportMarkdown
{
    internal static string Compose(
        string environmentName,
        string apiBaseUrl,
        string apiBaseUrlRedacted,
        DateTime generatedAtUtc,
        string? repositoryRoot,
        string? gitHeadSha,
        bool? gitDirty,
        DeploymentEvidenceProbeBundle bundle,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli,
        bool allowMissingOpenApi,
        string syntheticPath)
    {
        StringBuilder sb = new();
        sb.AppendLine("# ArchLucid deployment evidence");
        sb.AppendLine();
        sb.AppendLine(
            "> **Disclaimer:** This file is **host-environment deployment evidence** for the named environment and probe URL at the captured UTC time. " +
            "It is **not** a global product certification, attestation, or buyer-facing compliance guarantee.");
        sb.AppendLine();
        sb.AppendLine("## Target");
        sb.AppendLine();
        sb.AppendLine("| Field | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine("| **Environment label** | " + EscapeMd(environmentName) + " |");
        sb.AppendLine("| **Probe base URL** | `" + EscapeMd(apiBaseUrlRedacted) + "` |");
        sb.AppendLine("| **Generated at (UTC)** | " + EscapeMd(generatedAtUtc.ToString("O")) + " |");
        sb.AppendLine("| **Synthetic path** | `" + EscapeMd(syntheticPath) + "` |");
        sb.AppendLine("| **OpenAPI break-glass** | " + (allowMissingOpenApi ? "`--allow-missing-openapi` (recorded)" : "off (default)") + " |");
        sb.AppendLine();

        sb.AppendLine("## Repository / git (operator checkout)");
        sb.AppendLine();

        if (repositoryRoot is null)
        {
            sb.AppendLine("Repository root could not be resolved (pass `--repo` from CI checkout or run inside the repo tree).");
        }
        else
        {
            sb.AppendLine("- **Root:** `" + EscapeMd(repositoryRoot) + "`");
            sb.AppendLine(
                gitHeadSha is null
                    ? "- **Commit:** (unknown — set `GITHUB_SHA` in CI or ensure `git` is on PATH)"
                    : "- **Commit:** `" + EscapeMd(gitHeadSha) + "`");
            sb.AppendLine(
                gitDirty switch
                {
                    true => "- **Working tree:** **dirty** (uncommitted changes)",
                    false => "- **Working tree:** clean",
                    null => "- **Working tree:** (not determined)"
                });
        }

        sb.AppendLine();

        sb.AppendLine("## HTTP probes");
        sb.AppendLine();

        foreach (DeploymentEvidenceProbeResult p in bundle.Probes)
        {
            sb.AppendLine("### " + EscapeMd(p.Name));
            sb.AppendLine();
            sb.AppendLine("- **Passed:** " + (p.Passed ? "yes" : "**no**"));
            sb.AppendLine("- **HTTP status:** " + p.StatusCode);
            sb.AppendLine("- **Summary:** " + EscapeMd(p.DetailLine));

            if (!string.IsNullOrWhiteSpace(p.BodyPreview))
            {
                sb.AppendLine();
                sb.AppendLine("```");
                sb.AppendLine(p.BodyPreview);
                sb.AppendLine("```");
            }

            if (!p.Passed && p.NextSteps.Count > 0)
            {
                sb.AppendLine();
                sb.AppendLine("**Next steps:**");

                foreach (string step in p.NextSteps)
                    sb.AppendLine("- " + step);
            }

            sb.AppendLine();
        }

        sb.AppendLine("## Smoke / validation commands");
        sb.AppendLine();
        sb.AppendLine("**Shell (curl + jq)** — legacy script aligned with this tool:");
        sb.AppendLine();
        sb.AppendLine("```bash");
        sb.AppendLine("bash scripts/ci/cd-post-deploy-verify.sh \"" + apiBaseUrlRedacted + "\" \"" + EscapeShellToken(syntheticPath) + "\"");
        sb.AppendLine("```");
        sb.AppendLine();
        sb.AppendLine("**CLI (this tool)** — same probes + Markdown report:");
        sb.AppendLine();
        sb.AppendLine("```bash");
        sb.AppendLine(
            "dotnet run --project ArchLucid.Cli -- deployment-evidence \\\n" +
            "  --environment " + EscapeShellToken(environmentName) + " \\\n" +
            "  --api-base-url \"" + apiBaseUrlRedacted + "\" \\\n" +
            "  --synthetic-path \"" + EscapeShellToken(syntheticPath) + "\" \\\n" +
            "  --out artifacts/deployment-evidence-<env>-<run-id>.md \\\n" +
            "  --repo .");
        sb.AppendLine("```");
        sb.AppendLine();

        sb.AppendLine("## Terraform roots (expected apply order)");
        sb.AppendLine();
        sb.AppendLine(
            "Authoritative detail: `"
            + DeploymentEvidenceTerraformReference.DocumentationRelativePath
            + "`. Summary order:");
        sb.AppendLine();

        int i = 1;

        foreach (string line in DeploymentEvidenceTerraformReference.DefaultApplyOrderRoots())
            sb.AppendLine($"{i++}. {line}");

        sb.AppendLine();

        sb.AppendLine("## Configuration posture (local runner / process environment)");
        sb.AppendLine();
        AppendPostureSection(sb, cli, apiBaseUrlRedacted);

        return sb.ToString();
    }

    internal static void AppendPostureSection(
        StringBuilder sb,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli,
        string apiBaseUrlRedacted)
    {
        if (cli is not null)
        {
            sb.AppendLine("- **archlucid.json:** loaded; project `" + EscapeMd(cli.ProjectName) + "` (schema " + cli.SchemaVersion + ").");
            string? fromConfig = string.IsNullOrWhiteSpace(cli.ApiUrl) ? null : SupportBundleRedactor.RedactHttpUrl(cli.ApiUrl);
            sb.AppendLine(
                string.IsNullOrEmpty(fromConfig)
                    ? "- **Config `apiUrl`:** (unset — CLI probes used `--api-base-url` below)"
                    : "- **Config `apiUrl` (redacted):** `" + EscapeMd(fromConfig) + "`");
        }
        else
        {
            sb.AppendLine("- **archlucid.json:** not found in current working tree (skipped project summary).");
        }

        sb.AppendLine("- **Effective probe URL (redacted):** `" + EscapeMd(apiBaseUrlRedacted) + "`");
        sb.AppendLine();

        IConfiguration configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();
        string envName =
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? Environments.Production;

        IReadOnlyList<string> hints = ProductionLikeHostingMisconfigurationAdvisor.DescribeWarnings(configuration, envName);

        if (hints.Count == 0)
        {
            sb.AppendLine("No `ProductionLikeHostingMisconfigurationAdvisor` warnings for this shell environment (mirrors common API misconfig patterns).");

            return;
        }

        sb.AppendLine("Warnings (same advisor as `archlucid doctor`; **no secret values** are emitted here):");
        sb.AppendLine();

        foreach (string hint in hints)
            sb.AppendLine("- " + hint);
    }

    private static string EscapeMd(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        return value.Replace("\r\n", "\n", StringComparison.Ordinal).Replace("|", "\\|", StringComparison.Ordinal);
    }

    private static string EscapeShellToken(string value)
    {
        if (value.Contains('"', StringComparison.Ordinal))
            return value.Replace("\"", "\\\"", StringComparison.Ordinal);

        return value;
    }
}
