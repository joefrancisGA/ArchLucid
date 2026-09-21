using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class UploadedConfigInfrastructureDeclarationParserTests
{
    private readonly AppSettingsJsonInfrastructureDeclarationParser _appSettingsParser =
        new(NullLogger<AppSettingsJsonInfrastructureDeclarationParser>.Instance);

    private readonly DotenvInfrastructureDeclarationParser _dotenvParser =
        new(NullLogger<DotenvInfrastructureDeclarationParser>.Instance);

    private readonly ComposeEnvInfrastructureDeclarationParser _composeParser =
        new(NullLogger<ComposeEnvInfrastructureDeclarationParser>.Instance);

    private readonly TerraformShowJsonInfrastructureDeclarationParser _terraformParser =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task AppSettingsJson_sql_connection_string_emits_proposed_sql_host_and_catalog()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "appsettings.Development.json",
            Format = "appsettings-json",
            DeclarationId = "appsettings-1",
            Content = """
                      {
                        "ConnectionStrings": {
                          "Default": "Server=tcp:sql1.database.windows.net;Initial Catalog=archlucid;User ID=x;"
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _appSettingsParser.ParseAsync(declaration, CancellationToken.None);

        objects.Should().ContainSingle();
        CanonicalObject proposal = objects[0];
        proposal.ObjectType.Should().Be(OperatorInferredConnectionCanonicalTypes.ProposalObjectType);
        proposal.Properties[OperatorInferredConnectionCanonicalPropertyKeys.ProvenanceKind]
            .Should().Be(ProvenanceKind.DeterministicInference.ToString());
        proposal.Properties[OperatorInferredConnectionCanonicalPropertyKeys.ToHost]
            .Should().Be("sql1.database.windows.net");
        proposal.Properties[OperatorInferredConnectionCanonicalPropertyKeys.ToCatalog]
            .Should().Be("archlucid");
        proposal.Properties[OperatorInferredConnectionCanonicalPropertyKeys.SourceFileFormat]
            .Should().Be("appsettings-json");
        proposal.Properties.Should().NotContainKey("Password");
    }

    [Fact]
    public async Task Dotenv_api_base_url_emits_proposed_host()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = ".env",
            Format = "dotenv",
            DeclarationId = "dotenv-1",
            Content = "ARCHLUCID_API_BASE_URL=https://api.example.com\n",
        };

        IReadOnlyList<CanonicalObject> objects = await _dotenvParser.ParseAsync(declaration, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.ToHost]
            .Should().Be("api.example.com");
        objects[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.SourceFileFormat]
            .Should().Be("dotenv");
    }

    [Fact]
    public async Task AppSettingsJson_password_key_with_random_string_is_dropped()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "appsettings.json",
            Format = "appsettings-json",
            DeclarationId = "appsettings-2",
            Content = """
                      {
                        "ArchLucid__ApiKey": "not-a-host-value"
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _appSettingsParser.ParseAsync(declaration, CancellationToken.None);

        objects.Should().BeEmpty();
    }

    [Fact]
    public async Task ComposeEnv_environment_map_emits_proposed_host()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "docker-compose.yml",
            Format = "compose-env",
            DeclarationId = "compose-1",
            Content = """
                      services:
                        api:
                          environment:
                            ARCHLUCID_API_BASE_URL: https://api.example.com
                      """,
        };

        IReadOnlyList<CanonicalObject> objects = await _composeParser.ParseAsync(declaration, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.ToHost]
            .Should().Be("api.example.com");
        objects[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.FromLabel]
            .Should().Be("api");
        objects[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.SourceFileFormat]
            .Should().Be("compose-env");
    }

    [Fact]
    public async Task TerraformShowJson_container_app_env_url_emits_proposal()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "terraform.tfstate.json",
            Format = "terraform-show-json",
            DeclarationId = "tf-1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "address": "azurerm_container_app.api",
                                "type": "azurerm_container_app",
                                "name": "api",
                                "values": {
                                  "template": [
                                    {
                                      "container": [
                                        {
                                          "env": [
                                            {
                                              "name": "ARCHLUCID_API_BASE_URL",
                                              "value": "https://api.example.com"
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              }
                            ]
                          }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> proposals = (await _terraformParser.ParseAsync(declaration, CancellationToken.None))
            .Where(o => o.ObjectType == OperatorInferredConnectionCanonicalTypes.ProposalObjectType)
            .ToList();

        proposals.Should().ContainSingle();
        proposals[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.ToHost]
            .Should().Be("api.example.com");
        proposals[0].Properties[OperatorInferredConnectionCanonicalPropertyKeys.SourceFileFormat]
            .Should().Be("terraform-show-json");
    }

    [Fact]
    public async Task TerraformShowJson_redacted_sensitive_env_does_not_emit_false_host()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "terraform.tfstate.json",
            Format = "terraform-show-json",
            DeclarationId = "tf-2",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "address": "azurerm_container_app.api",
                                "type": "azurerm_container_app",
                                "name": "api",
                                "values": {
                                  "template": [
                                    {
                                      "container": [
                                        {
                                          "env": [
                                            {
                                              "name": "ConnectionStrings__Default",
                                              "value": "[REDACTED]"
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              }
                            ]
                          }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> proposals = (await _terraformParser.ParseAsync(declaration, CancellationToken.None))
            .Where(o => o.ObjectType == OperatorInferredConnectionCanonicalTypes.ProposalObjectType)
            .ToList();

        proposals.Should().BeEmpty();
    }
}
