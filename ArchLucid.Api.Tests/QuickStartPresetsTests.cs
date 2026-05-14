using ArchLucid.Api.Demo;

using Xunit;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class QuickStartPresetsTests
{
    [Fact]
    public void TryGet_null_or_whitespace_returns_false()
    {
        bool a = QuickStartPresets.TryGet(null, out QuickStartPresets.PresetPayload p1);
        bool b = QuickStartPresets.TryGet("   ", out QuickStartPresets.PresetPayload p2);

        Assert.False(a);
        Assert.False(b);
        Assert.Null(p1);
        Assert.Null(p2);
    }

    [Fact]
    public void TryGet_unknown_returns_false()
    {
        bool ok = QuickStartPresets.TryGet("no-such-preset", out QuickStartPresets.PresetPayload payload);

        Assert.False(ok);
        Assert.Null(payload);
    }

    [Fact]
    public void TryGet_trims_key_and_is_case_insensitive()
    {
        Assert.True(QuickStartPresets.TryGet("  MicroServices  ", out QuickStartPresets.PresetPayload a));
        Assert.True(QuickStartPresets.TryGet("EVENT-DRIVEN", out QuickStartPresets.PresetPayload b));

        Assert.NotNull(a);
        Assert.NotNull(b);
        Assert.Equal("Quick Start — Microservices", a.SystemDisplayName);
        Assert.Equal("Quick Start — Event-driven platform", b.SystemDisplayName);
    }

    [Fact]
    public void Preset_constraints_include_logical_scope_pins()
    {
        Assert.True(QuickStartPresets.TryGet("monolith-migration", out QuickStartPresets.PresetPayload payload));
        Assert.NotNull(payload);

        foreach (string pin in QuickStartPresets.LogicalScopePins)

            Assert.Contains(pin, payload.Constraints);

        Assert.True(payload.Constraints.Count >= QuickStartPresets.LogicalScopePins.Length);
    }

    [Fact]
    public void Items_exposes_three_named_presets()
    {
        Assert.Equal(3, QuickStartPresets.Items.Count);

        foreach (string key in new[] { "microservices", "monolith-migration", "event-driven" })

            Assert.True(QuickStartPresets.Items.ContainsKey(key));
    }
}
