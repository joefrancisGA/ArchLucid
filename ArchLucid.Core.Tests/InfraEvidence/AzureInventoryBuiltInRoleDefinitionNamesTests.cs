using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class AzureInventoryBuiltInRoleDefinitionNamesTests
{
    [Theory]
    [InlineData("090c5cfd-751d-490a-894a-3ce6f1109419", "Azure Service Bus Data Owner")]
    [InlineData("4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0", "Azure Service Bus Data Receiver")]
    [InlineData("69a216fc-b8fb-44d8-bc22-1f3c2cd27a39", "Azure Service Bus Data Sender")]
    [InlineData("f526a384-b230-433a-b45c-95f59c4a2dec", "Azure Event Hubs Data Owner")]
    [InlineData("a638d3c7-ab3a-418d-83e6-5f17a39d4fde", "Azure Event Hubs Data Receiver")]
    [InlineData("2b629674-e913-4c01-ae53-ef4638d8f975", "Azure Event Hubs Data Sender")]
    [InlineData("c6a89b2d-59bc-44d0-9896-0f6e12d7b80a", "Storage Queue Data Message Sender")]
    [InlineData("8a0f0c08-91a1-4084-bc3d-661d67233fed", "Storage Queue Data Message Processor")]
    [InlineData("974c5e8b-45b9-4653-ba55-5f855dd0fb88", "Storage Queue Data Contributor")]
    [InlineData("5e0bd9bd-7b93-4f28-af87-19fc36ad61bd", "Cognitive Services OpenAI User")]
    [InlineData("1407120a-92aa-4202-b7e9-c0e197c71c8f", "Search Index Data Reader")]
    [InlineData("8ebe5a00-799e-43f5-93ac-243d3dce84a7", "Search Index Data Contributor")]
    [InlineData("7ca78c08-252a-4471-8644-bb5ff32d4ba0", "Search Service Contributor")]
    public void TryResolveFromRoleDefinitionId_resolves_allowlisted_role(
        string roleDefinitionId,
        string expectedRoleName)
    {
        AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(
                $"/providers/Microsoft.Authorization/roleDefinitions/{roleDefinitionId}")
            .Should()
            .Be(expectedRoleName);
    }

    [Fact]
    public void TryResolveFromRoleDefinitionId_does_not_resolve_unlisted_role()
    {
        AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(
                "/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-000000000099")
            .Should()
            .BeNull();
    }
}
