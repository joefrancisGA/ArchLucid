using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Simple Terraform Declaration Parser.
/// </summary>
[Trait("Suite", "Core")]
public sealed class SimpleTerraformDeclarationParserTests
{
    private readonly SimpleTerraformDeclarationParser _sut = new();

    [Fact]
    public async Task ParseAsync_TrimsPaddedResourceName()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \"azurerm_virtual_network\" \" hub-vnet \"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task ParseAsync_TerraformTypeCasing_IsCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \"azurerm_Virtual_Network\" \"core\"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ResourceNameCasing_IsCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \"azurerm_virtual_network\" \"Hub-Vnet\"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task ParseAsync_TrimsPaddedResourceType()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.tf",
            Format = "simple-terraform",
            Content = "resource \" azurerm_virtual_network \" \"core\"\n"
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ExtractsResourceBlocks()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "stub.tf",
            Format = "simple-terraform",
            Content = """
                      resource "azurerm_virtual_network" "core"
                      resource "azurerm_subnet" "app"
                      resource "azurerm_storage_account" "docs"
                      resource "azurerm_linux_web_app" "api"
                      resource "azurerm_key_vault" "kv"
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(5);
        result.Should().ContainSingle(o => o.Name == "kv" && o.ObjectType == "SecurityBaseline");
        result.Should().ContainSingle(o =>
            o.Name == "core" && o.Properties["terraformType"] == "azurerm_virtual_network");
    }

    [Fact]
    public async Task ParseAsync_ExtractsAwsAndGcpResourceBlocks()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "multi.tf",
            Format = "simple-terraform",
            Content = """
                      resource "aws_vpc" "core"
                      resource "aws_security_group" "web"
                      resource "google_compute_firewall" "allow_https"
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(3);
        result.Should().ContainSingle(o => o.Name == "core" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "web" && o.ObjectType == "SecurityBaseline");
        result.Should().ContainSingle(o =>
            o.Name == "allow_https" && o.Properties["terraformType"] == "google_compute_firewall");
    }
}
