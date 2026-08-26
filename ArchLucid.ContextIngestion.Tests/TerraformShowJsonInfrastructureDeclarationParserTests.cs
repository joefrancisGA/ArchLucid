using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;
[Trait("Category", "Unit")]

public sealed class TerraformShowJsonInfrastructureDeclarationParserTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_extracts_root_module_resources()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d1",
            Content = """
                      {
                        "format_version": "1.0",
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "address": "azurerm_resource_group.main",
                                "mode": "managed",
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "location": "eastus", "name": "rg-demo" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        CanonicalObject o = objects[0];
        o.ObjectType.Should().Be("TopologyResource");
        o.Name.Should().Be("azurerm_resource_group.main");
        o.Properties.Should().ContainKey("terraformType");
        o.Properties["terraformType"].Should().Be("azurerm_resource_group");
        o.Properties.Should().ContainKey("tf.location");
    }

    [Fact]
    public async Task ParseAsync_maps_key_vault_to_security_baseline()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d2",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_key_vault",
                                "name": "core",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "mode": "managed",
                                "values": { "name": "kv1" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_empty_values_returns_empty()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "bad", Format = "terraform-show-json", DeclarationId = "d3", Content = "{}"
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_collects_child_module_resources()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d4",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [],
                            "child_modules": [
                              {
                                "resources": [
                                  {
                                    "type": "azurerm_storage_account",
                                    "name": "data",
                                    "mode": "managed",
                                    "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                    "values": { "name": "stacct" }
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Name.Should().Be("azurerm_storage_account.data");
        objects[0].Properties.Should().ContainKey("mode");
    }

    [Fact]
    public async Task ParseAsync_resolves_type_after_provider_slash()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d5",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "registry.terraform.io/hashicorp/azurerm/azurerm_network_security_group",
                                "name": "nsg",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_maps_policy_assignment_type()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d6",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_policy_assignment",
                                "name": "audit",
                                "values": { "name": "pa1" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("PolicyControl");
    }

    [Fact]
    public async Task ParseAsync_serializes_numeric_and_boolean_value_kinds()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d7",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "x",
                                "values": {
                                  "sku": 42,
                                  "enabled": true,
                                  "disabled": false,
                                  "nested": { "a": 1 },
                                  "weird name!": "v"
                                }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        CanonicalObject o = objects[0];
        o.Properties.Should().ContainKey("tf.sku");
        o.Properties["tf.sku"].Should().Be("42");
        o.Properties["tf.enabled"].Should().Be("true");
        o.Properties["tf.disabled"].Should().Be("false");
        o.Properties.Should().ContainKey("tf.weird_name_");
    }

    [Fact]
    public async Task ParseAsync_truncates_long_attribute_values()
    {
        string longText = new('x', 600);
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d8",
            Content = $$"""
                        {
                          "values": {
                            "root_module": {
                              "resources": [
                                {
                                  "type": "azurerm_resource_group",
                                  "name": "x",
                                  "values": { "big": "{{longText}}" }
                                }
                              ]
                            }
                          }
                        }
                        """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.big"].Length.Should().Be(512);
    }

    [Fact]
    public async Task ParseAsync_serializes_depends_on_pipe_list()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d10",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_storage_account",
                                "name": "st",
                                "values": { "name": "s" },
                                "depends_on": ["azurerm_resource_group.main"]
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties.Should().ContainKey("terraformDependsOn");
        objects[0].Properties["terraformDependsOn"].Should().Be("azurerm_resource_group.main");
    }

    [Fact]
    public async Task ParseAsync_CanonicalizesDependsOnReferenceCasing()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-dep",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_storage_account",
                                "name": "st",
                                "values": { "name": "s" },
                                "depends_on": ["azurerm_Resource_Group.Main"]
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["terraformDependsOn"].Should().Be("azurerm_resource_group.main");
    }

    [Fact]
    public async Task ParseAsync_redacts_top_level_sensitive_tf_values()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d11",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "x",
                                "values": { "admin_secret": "hidden" },
                                "sensitive_values": { "admin_secret": true }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.admin_secret"].Should().Be("[REDACTED]");
    }

    [Fact]
    public async Task ParseAsync_extracts_aws_ec2_topology_resource()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "aws-state",
            Format = "terraform-show-json",
            DeclarationId = "aws-1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "aws_instance",
                                "name": "web",
                                "provider_name": "registry.terraform.io/hashicorp/aws",
                                "mode": "managed",
                                "values": { "instance_type": "t3.micro", "availability_zone": "us-east-1a" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("TopologyResource");
        objects[0].Properties["terraformType"].Should().Be("aws_instance");
        objects[0].Properties["providerName"].Should().Be("registry.terraform.io/hashicorp/aws");
    }

    [Fact]
    public async Task ParseAsync_maps_aws_security_group_to_security_baseline()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "aws-state",
            Format = "terraform-show-json",
            DeclarationId = "aws-2",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "aws_security_group",
                                "name": "web",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_extracts_gcp_compute_topology_resource()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "gcp-state",
            Format = "terraform-show-json",
            DeclarationId = "gcp-1",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "google_compute_instance",
                                "name": "app",
                                "provider_name": "registry.terraform.io/hashicorp/google",
                                "mode": "managed",
                                "values": { "machine_type": "e2-medium", "zone": "us-central1-a" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("TopologyResource");
        objects[0].Properties["terraformType"].Should().Be("google_compute_instance");
        objects[0].Properties["providerName"].Should().Be("registry.terraform.io/hashicorp/google");
    }

    [Fact]
    public async Task ParseAsync_maps_gcp_firewall_to_security_baseline()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "gcp-state",
            Format = "terraform-show-json",
            DeclarationId = "gcp-2",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "google_compute_firewall",
                                "name": "allow_https",
                                "provider_name": "registry.terraform.io/hashicorp/google",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be("SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_TerraformTypeCasing_IsCanonicalized()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-case",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_Virtual_Network",
                                "name": "core",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ModeAndProviderNameCasing_AreCanonicalized()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-meta",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "provider_name": "Registry.Terraform.IO/HashiCorp/Azurerm",
                                "mode": "Managed",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["providerName"].Should().Be("registry.terraform.io/hashicorp/azurerm");
        objects[0].Properties["mode"].Should().Be("managed");
    }

    [Fact]
    public async Task ParseAsync_TfStringValues_AreCanonicalized()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-tf",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "values": { "location": "EastUS" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.location"].Should().Be("eastus");
    }

    [Fact]
    public async Task ParseAsync_CanonicalizesComplexTfJsonCasing()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-tags",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_resource_group",
                                "name": "main",
                                "values": {
                                  "tags": { "Environment": "Prod" }
                                }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.tags"].Should().Be("{\"environment\":\"prod\"}");
    }

    [Fact]
    public async Task ParseAsync_CanonicalizesEquivalentTfNumericFormats()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-capacity",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_service_plan",
                                "name": "main",
                                "values": { "worker_count": 1 }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Properties["tf.worker_count"].Should().Be("1");
    }

    [Fact]
    public async Task ParseAsync_EquivalentNumericRepresentations_ProduceSameTfProperties()
    {
        const string jsonInt = """
                               {
                                 "values": {
                                   "root_module": {
                                     "resources": [
                                       {
                                         "type": "azurerm_service_plan",
                                         "name": "main",
                                         "values": { "worker_count": 1 }
                                       }
                                     ]
                                   }
                                 }
                               }
                               """;

        string jsonDecimal = jsonInt.Replace("\"worker_count\": 1", "\"worker_count\": 1.0");

        InfrastructureDeclarationReference declInt = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-int",
            Content = jsonInt
        };

        InfrastructureDeclarationReference declDecimal = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-decimal",
            Content = jsonDecimal
        };

        IReadOnlyList<CanonicalObject> intObjects = await _sut.ParseAsync(declInt, CancellationToken.None);
        IReadOnlyList<CanonicalObject> decimalObjects = await _sut.ParseAsync(declDecimal, CancellationToken.None);

        intObjects.Should().ContainSingle();
        decimalObjects.Should().ContainSingle();
        decimalObjects[0].Properties.Should().BeEquivalentTo(intObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_EquivalentScientificNotation_ProduceSameTfProperties()
    {
        const string jsonInt = """
                               {
                                 "values": {
                                   "root_module": {
                                     "resources": [
                                       {
                                         "type": "azurerm_service_plan",
                                         "name": "main",
                                         "values": { "worker_count": 1 }
                                       }
                                     ]
                                   }
                                 }
                               }
                               """;

        string jsonScientific = jsonInt.Replace("\"worker_count\": 1", "\"worker_count\": 1e0");

        InfrastructureDeclarationReference declInt = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-int",
            Content = jsonInt
        };

        InfrastructureDeclarationReference declScientific = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-sci",
            Content = jsonScientific
        };

        IReadOnlyList<CanonicalObject> intObjects = await _sut.ParseAsync(declInt, CancellationToken.None);
        IReadOnlyList<CanonicalObject> scientificObjects = await _sut.ParseAsync(declScientific, CancellationToken.None);

        intObjects.Should().ContainSingle();
        scientificObjects.Should().ContainSingle();
        scientificObjects[0].Properties.Should().BeEquivalentTo(intObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_EquivalentBooleanRepresentations_ProduceSameTfProperties()
    {
        const string jsonBoolean = """
                                   {
                                     "values": {
                                       "root_module": {
                                         "resources": [
                                           {
                                             "type": "azurerm_linux_web_app",
                                             "name": "main",
                                             "values": { "https_only": true }
                                           }
                                         ]
                                       }
                                     }
                                   }
                                   """;

        string jsonString = jsonBoolean.Replace("\"https_only\": true", "\"https_only\": \"true\"");

        InfrastructureDeclarationReference declBoolean = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-bool",
            Content = jsonBoolean
        };

        InfrastructureDeclarationReference declString = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-str",
            Content = jsonString
        };

        IReadOnlyList<CanonicalObject> booleanObjects = await _sut.ParseAsync(declBoolean, CancellationToken.None);
        IReadOnlyList<CanonicalObject> stringObjects = await _sut.ParseAsync(declString, CancellationToken.None);

        booleanObjects.Should().ContainSingle();
        stringObjects.Should().ContainSingle();
        stringObjects[0].Properties.Should().BeEquivalentTo(booleanObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_MissingVsNullTfValues_ProduceSameTfProperties()
    {
        const string jsonMissing = """
                                   {
                                     "values": {
                                       "root_module": {
                                         "resources": [
                                           {
                                             "type": "azurerm_linux_web_app",
                                             "name": "main",
                                             "values": { "location": "eastus" }
                                           }
                                         ]
                                       }
                                     }
                                   }
                                   """;

        const string jsonExplicitNull = """
                                        {
                                          "values": {
                                            "root_module": {
                                              "resources": [
                                                {
                                                  "type": "azurerm_linux_web_app",
                                                  "name": "main",
                                                  "values": {
                                                    "location": "eastus",
                                                    "client_affinity_enabled": null
                                                  }
                                                }
                                              ]
                                            }
                                          }
                                        }
                                        """;

        InfrastructureDeclarationReference declMissing = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-missing",
            Content = jsonMissing
        };

        InfrastructureDeclarationReference declNull = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-null",
            Content = jsonExplicitNull
        };

        IReadOnlyList<CanonicalObject> missingObjects = await _sut.ParseAsync(declMissing, CancellationToken.None);
        IReadOnlyList<CanonicalObject> nullObjects = await _sut.ParseAsync(declNull, CancellationToken.None);

        missingObjects.Should().ContainSingle();
        nullObjects.Should().ContainSingle();
        nullObjects[0].Properties.Should().BeEquivalentTo(missingObjects[0].Properties);
    }

    [Fact]
    public void CanParse_TrimsPaddedFormat()
    {
        _sut.CanParse(" terraform-show-json ").Should().BeTrue();
    }

    [Fact]
    public async Task ParseAsync_TrimsPaddedResourceName()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "state",
            Format = "terraform-show-json",
            DeclarationId = "d-pad",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_virtual_network",
                                "name": " core ",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Name.Should().Be("azurerm_virtual_network.core");
    }

    [Fact]
    public async Task ParseAsync_whitespace_content_returns_empty()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "empty", Format = "terraform-show-json", DeclarationId = "d9", Content = "   "
        };

        IReadOnlyList<CanonicalObject> objects = await _sut.ParseAsync(decl, CancellationToken.None);

        objects.Should().BeEmpty();
    }
}
