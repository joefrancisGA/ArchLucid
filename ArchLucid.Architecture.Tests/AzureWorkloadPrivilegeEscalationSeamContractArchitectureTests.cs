using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-1244: Azure workload privilege-escalation seam contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureWorkloadPrivilegeEscalationSeamContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb1244_azure_workload_pe_seam_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-1244");
        text.Should().Contain("enable_api_sql_runtime_identity");
        text.Should().Contain("db_owner");
        text.Should().Contain("OpenAI User");
        text.Should().Contain("TB-1245");
    }

    [Fact]
    public void Tb1244_gtm_m216_section_and_alias_exist()
    {
        string packetPath = Path.Combine(RepoRoot, "docs", "go-to-market", "BUYER_SECURITY_PROCUREMENT_PACKET.md");
        string aliasPath = Path.Combine(RepoRoot, "docs", "go-to-market", "AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_PA_ONE_PAGER.md");

        File.Exists(packetPath).Should().BeTrue();
        File.Exists(aliasPath).Should().BeTrue();

        string packet = File.ReadAllText(packetPath);
        packet.Should().Contain("azure-workload-privilege-escalation-seam-m-216");
        packet.Should().Contain("TB-1244");

        File.ReadAllText(aliasPath).Should().Contain("M-216");
    }

    [Fact]
    public void Tb1244_terraform_and_mi_doc_anchors_exist()
    {
        string mainTf = Path.Combine(RepoRoot, "infra", "terraform-container-apps", "main.tf");
        string openAiTf = Path.Combine(RepoRoot, "infra", "terraform-container-apps", "azure_openai.tf");
        string miDoc = Path.Combine(RepoRoot, "docs", "security", "MANAGED_IDENTITY_SQL_BLOB.md");

        File.Exists(mainTf).Should().BeTrue();
        File.Exists(openAiTf).Should().BeTrue();
        File.Exists(miDoc).Should().BeTrue();

        File.ReadAllText(mainTf).Should().Contain("enable_api_sql_runtime_identity");
        File.ReadAllText(openAiTf).Should().Contain("Cognitive Services OpenAI User");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
