using ArchLucid.Core.ProductCapability;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>OP-02 soft check: known UI architecture-only hrefs align with controller productLine rows.</summary>
[Trait("Suite", "Architecture")]
public sealed class ProductCapabilityControllerUiConsistencyTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Known_architecture_only_ui_surfaces_map_to_architecture_product_line_controllers()
    {
        ProductCapabilityMapDocument map = ProductCapabilityMapLoader.Load();

        (string ControllerTypeName, string UiHint)[] knownPairs =
        [
            ("ArchLucid.Api.Controllers.Scim.ScimUsersController", "/administration/scim-provisioning"),
            ("ArchLucid.Api.Controllers.Scim.ScimGroupsController", "/administration/scim-provisioning"),
            ("ArchLucid.Api.Controllers.Scim.ScimDiscoveryController", "/administration/scim-provisioning"),
            (
                "ArchLucid.Api.Controllers.InfraEvidence.TenantBrandingAdminController",
                "/administration/branding"),
            ("ArchLucid.Api.Controllers.Authority.RunsController", "/reviews"),
            (
                "ArchLucid.Api.Controllers.Integrations.AzureBoardsIntegrationsController",
                "/integrations/azure-boards"),
            ("ArchLucid.Api.Controllers.Integrations.SlackInteractivityController", "/integrations/slack"),
            ("ArchLucid.Api.Controllers.Integrations.WebhookConnectionsController", "/integrations/webhooks"),
        ];

        foreach ((string controllerTypeName, string uiHint) in knownPairs)
        {
            ProductCapabilityMapControllerEntry? entry = map.Controllers
                .FirstOrDefault(row => string.Equals(row.TypeName, controllerTypeName, StringComparison.Ordinal));

            entry.Should().NotBeNull($"controller row missing for UI hint {uiHint}");
            entry!.ProductLine.Should().Be(
                "architecture",
                because: "UI catalog marks {0} as architecture-only",
                uiHint);
        }
    }
}
