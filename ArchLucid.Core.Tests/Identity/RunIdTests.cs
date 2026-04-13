using System.Text.Json;

using ArchLucid.Core.Identity;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Identity;

public sealed class RunIdTests
{
    [Fact]
    public void New_produces_non_empty_value()
    {
        RunId id = RunId.New();

        id.Value.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Explicit_conversion_round_trips_guid()
    {
        Guid g = Guid.Parse("11111111-2222-3333-4444-555555555555");
        RunId id = (RunId)g;

        ((Guid)id).Should().Be(g);
    }

    [Fact]
    public void Json_round_trip_uses_guid_string()
    {
        RunId original = RunId.New();
        JsonSerializerOptions opts = new();

        string json = JsonSerializer.Serialize(original, opts);
        RunId back = JsonSerializer.Deserialize<RunId>(json, opts);

        back.Value.Should().Be(original.Value);
    }

    [Fact]
    public void CompareTo_orders_by_guid()
    {
        RunId a = (RunId)Guid.Parse("00000000-0000-0000-0000-000000000001");
        RunId b = (RunId)Guid.Parse("00000000-0000-0000-0000-000000000002");

        a.CompareTo(b).Should().BeLessThan(0);
    }
}
