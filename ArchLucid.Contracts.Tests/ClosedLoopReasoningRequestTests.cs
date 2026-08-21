using System.Reflection;
using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ClosedLoopReasoningRequestTests
{
    [Fact]
    public void TenantId_is_nullable_so_api_controller_does_not_require_it_on_inbound_bodies()
    {
        PropertyInfo property = typeof(ClosedLoopReasoningRequest).GetProperty(
            nameof(ClosedLoopReasoningRequest.TenantId))!;
        NullabilityInfoContext context = new();
        NullabilityInfo info = context.Create(property);

        info.ReadState.Should().Be(NullabilityState.Nullable);
        info.WriteState.Should().Be(NullabilityState.Nullable);
    }

    [Fact]
    public void Json_without_tenant_id_deserializes()
    {
        ClosedLoopReasoningRequest? parsed = JsonSerializer.Deserialize<ClosedLoopReasoningRequest>(
            """{"sourceTexts":[{"fileName":"a.txt","contentType":"text/plain","content":"api"}]}""",
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        parsed.Should().NotBeNull();
        parsed!.TenantId.Should().BeNull();
        parsed.SourceTexts.Should().ContainSingle(source => source.Content == "api");
    }
}
