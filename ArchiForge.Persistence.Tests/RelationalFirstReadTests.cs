using ArchiForge.Persistence.RelationalRead;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchiForge.Persistence.Tests;

/// <summary>
/// Contract tests for <see cref="RelationalFirstRead"/> integration with <see cref="JsonFallbackPolicy"/>
/// across all three <see cref="PersistenceReadMode"/> values.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RelationalFirstReadTests
{
    private static JsonFallbackPolicy Allow() =>
        new(PersistenceReadMode.AllowJsonFallback, NullLogger.Instance);

    private static JsonFallbackPolicy Warn() =>
        new(PersistenceReadMode.WarnOnJsonFallback, NullLogger.Instance);

    private static JsonFallbackPolicy Require() =>
        new(PersistenceReadMode.RequireRelational, NullLogger.Instance);

    // ── Relational rows exist → always use relational ──────────────

    [Fact]
    public async Task ReadSliceAsync_RelationalRowsExist_CallsRelationalLoader()
    {
        bool relationalCalled = false;

        List<string> result = await RelationalFirstRead.ReadSliceAsync(
            relationalRowCount: 3,
            "Test.Slice",
            () => { relationalCalled = true; return Task.FromResult(new List<string> { "relational" }); },
            () => ["json-fallback"],
            () => [],
            policy: Allow());

        relationalCalled.Should().BeTrue();
        result.Should().Equal("relational");
    }

    // ── AllowJsonFallback ──────────────────────────────────────────

    [Fact]
    public async Task ReadSliceAsync_NoRows_AllowMode_CallsJsonFallback()
    {
        bool jsonCalled = false;

        List<string> result = await RelationalFirstRead.ReadSliceAsync(
            relationalRowCount: 0,
            "Test.Slice",
            () => Task.FromResult(new List<string> { "relational" }),
            () => { jsonCalled = true; return ["json-fallback"]; },
            () => [],
            policy: Allow());

        jsonCalled.Should().BeTrue();
        result.Should().Equal("json-fallback");
    }

    // ── WarnOnJsonFallback ─────────────────────────────────────────

    [Fact]
    public async Task ReadSliceAsync_NoRows_WarnMode_CallsJsonFallback()
    {
        bool jsonCalled = false;

        List<string> result = await RelationalFirstRead.ReadSliceAsync(
            relationalRowCount: 0,
            "Test.Slice",
            () => Task.FromResult(new List<string> { "relational" }),
            () => { jsonCalled = true; return ["json-fallback"]; },
            () => [],
            policy: Warn());

        jsonCalled.Should().BeTrue();
        result.Should().Equal("json-fallback");
    }

    // ── RequireRelational ──────────────────────────────────────────

    [Fact]
    public async Task ReadSliceAsync_NoRows_RequireMode_ThrowsRelationalDataMissing()
    {
        Func<Task> act = () => RelationalFirstRead.ReadSliceAsync(
            relationalRowCount: 0,
            "Test.Slice",
            () => Task.FromResult(new List<string> { "relational" }),
            () => ["json-fallback"],
            () => [],
            policy: Require(),
            entityType: "TestEntity",
            entityId: "id-99");

        RelationalDataMissingException ex = (await act.Should()
            .ThrowAsync<RelationalDataMissingException>()).Which;
        ex.EntityType.Should().Be("TestEntity");
        ex.EntityId.Should().Be("id-99");
        ex.SliceName.Should().Be("Test.Slice");
    }

    // ── Null policy → legacy fallback ──────────────────────────────

    [Fact]
    public async Task ReadSliceAsync_NoRows_NullPolicy_FallsBackToJson()
    {
        List<string> result = await RelationalFirstRead.ReadSliceAsync(
            relationalRowCount: 0,
            "Test.Slice",
            () => Task.FromResult(new List<string> { "relational" }),
            () => ["json-fallback"],
            () => [],
            policy: null);

        result.Should().Equal("json-fallback");
    }

    // ── Backward-compatible overload ───────────────────────────────

    [Fact]
    public async Task ReadSliceAsync_BackwardCompatOverload_AlwaysFallsBack()
    {
        List<string> result = await RelationalFirstRead.ReadSliceAsync(
            relationalRowCount: 0,
            () => Task.FromResult(new List<string> { "relational" }),
            () => ["json-fallback"]);

        result.Should().Equal("json-fallback");
    }
}
