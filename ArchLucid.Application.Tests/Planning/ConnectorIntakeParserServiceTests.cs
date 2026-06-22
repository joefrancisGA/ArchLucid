using ArchLucid.Application.Planning;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConnectorIntakeParserServiceTests
{
    [Fact]
    public async Task ParseAsync_terraform_show_json_builds_architecture_request_with_declaration()
    {
        const string terraformJson = """
                                     {
                                       "format_version": "1.0",
                                       "values": {
                                         "root_module": {
                                           "resources": [
                                             { "type": "azurerm_resource_group", "name": "rg" }
                                           ]
                                         }
                                       }
                                     }
                                     """;

        ConnectorIntakeParserService sut = new(Mock.Of<IGitTerraformContentFetcher>());

        ArchitectureRequest result = await sut.ParseAsync(
            new ConnectorIntakeRequest { Source = "terraform-show-json", TerraformShowJson = terraformJson },
            CancellationToken.None);

        result.InfrastructureDeclarations.Should().ContainSingle();
        result.InfrastructureDeclarations[0].Format.Should().Be("terraform-show-json");
        result.CloudProvider.Should().Be(Contracts.Common.CloudProvider.Azure);
        result.Description.Should().Contain("Terraform state");
    }

    [Fact]
    public async Task ParseAsync_git_terraform_fetches_file_and_builds_simple_terraform_declaration()
    {
        const string terraform = """
                                 resource "azurerm_storage_account" "logs" {
                                   name = "logs"
                                 }
                                 """;

        Mock<IGitTerraformContentFetcher> fetcher = new();
        fetcher
            .Setup(f => f.FetchTerraformFileAsync(
                "https://github.com/contoso/platform",
                "main",
                "infra/main.tf",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(terraform);

        ConnectorIntakeParserService sut = new(fetcher.Object);

        ArchitectureRequest result = await sut.ParseAsync(
            new ConnectorIntakeRequest
            {
                Source = "git-terraform",
                GitRepositoryUrl = "https://github.com/contoso/platform",
                GitBranch = "main",
                GitTerraformPath = "infra/main.tf",
            },
            CancellationToken.None);

        result.InfrastructureDeclarations.Should().ContainSingle();
        result.InfrastructureDeclarations[0].Format.Should().Be("simple-terraform");
        result.SystemName.Should().Be("platform-terraform");
    }

    [Fact]
    public void ParseGitHubCoordinates_parses_blob_urls()
    {
        (string owner, string repo, string path) = GitTerraformContentFetcher.ParseGitHubCoordinates(
            "https://github.com/contoso/platform/blob/develop/infra/main.tf",
            "main",
            "ignored.tf");

        owner.Should().Be("contoso");
        repo.Should().Be("platform");
        path.Should().Be("infra/main.tf");
    }
}
