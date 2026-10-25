using System.Reflection;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Data.Repositories;
[Trait("Category", "Unit")]

public sealed class InMemoryComparisonRecordRepositoryAdditionalCoverageTests
{
    private static ComparisonRecord Row(
        string id,
        DateTime created,
        string leftRun = "L",
        string rightRun = "R",
        string? label = null,
        List<string>? tags = null)
    {
        return new ComparisonRecord
        {
            ComparisonRecordId = id,
            ComparisonType = "t",
            LeftRunId = leftRun,
            RightRunId = rightRun,
            Format = "json",
            SummaryMarkdown = "s",
            PayloadJson = "{}",
            CreatedUtc = created,
            Label = label,
            Tags = tags ?? []
        };
    }

    [SkippableFact]
    public async Task SearchAsync_limit_zero_uses_default_page_size()
    {
        InMemoryComparisonRecordRepository sut = new();
        await sut.CreateAsync(Row("a", TimeProvider.System.UtcNowDateTime()), CancellationToken.None);

        IReadOnlyList<ComparisonRecord> page =
            await sut.SearchAsync(null, null, null, null, null, null, null, null, null, null, null, 0, 0,
                CancellationToken.None);

        page.Should().ContainSingle();
    }

    [SkippableFact]
    public async Task SearchAsync_finds_row_when_stored_left_run_id_uses_dashed_guid_and_filter_uses_n_format()
    {
        Guid runKey = Guid.Parse("66666666-6666-6666-6666-666666666666");
        string canonicalRunId = runKey.ToString("N");

        InMemoryComparisonRecordRepository sut = new();
        await sut.CreateAsync(
            Row("cmp-search-dashed-stored", TimeProvider.System.UtcNowDateTime(), leftRun: runKey.ToString("D")),
            CancellationToken.None);

        IReadOnlyList<ComparisonRecord> page = await sut.SearchAsync(
            null,
            canonicalRunId,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            0,
            10,
            CancellationToken.None);

        page.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-search-dashed-stored");
        page[0].LeftRunId.Should().Be(canonicalRunId);
    }

    [SkippableFact]
    public async Task SearchAsync_sorts_by_label_ascending()
    {
        InMemoryComparisonRecordRepository sut = new();
        DateTime t = TimeProvider.System.UtcNowDateTime();
        await sut.CreateAsync(Row("x", t, label: "b"), CancellationToken.None);
        await sut.CreateAsync(Row("y", t, label: "a"), CancellationToken.None);

        IReadOnlyList<ComparisonRecord> page = await sut.SearchAsync(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "label",
            "asc",
            0,
            10,
            CancellationToken.None);

        page.Select(p => p.Label).Should().ContainInOrder("a", "b");
    }

    [SkippableFact]
    public async Task SearchByCursorAsync_pages_when_legacy_stored_comparison_record_id_has_padding()
    {
        DateTime oldest = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime middle = new(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        DateTime newest = new(2026, 1, 3, 0, 0, 0, DateTimeKind.Utc);

        InMemoryComparisonRecordRepository sut = new();
        FieldInfo? itemsField = typeof(InMemoryComparisonRecordRepository).GetField(
            "_items",
            BindingFlags.Instance | BindingFlags.NonPublic);
        itemsField.Should().NotBeNull();
        List<ComparisonRecord> items = (List<ComparisonRecord>)itemsField!.GetValue(sut)!;
        items.Add(Row("cmp-cursor-oldest", oldest));
        items.Add(Row("  cmp-cursor-middle  ", middle));
        items.Add(Row("cmp-cursor-newest", newest));

        IReadOnlyList<ComparisonRecord> page = await sut.SearchByCursorAsync(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "createdUtc",
            "desc",
            newest,
            "cmp-cursor-newest",
            1,
            CancellationToken.None);

        page.Should().ContainSingle();
        page[0].ComparisonRecordId.Trim().Should().Be("cmp-cursor-middle");
    }

    [SkippableFact]
    public async Task SearchByCursor_ascending_pages_after_cursor()
    {
        InMemoryComparisonRecordRepository sut = new();
        DateTime t0 = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        await sut.CreateAsync(Row("early", t0), CancellationToken.None);
        await sut.CreateAsync(Row("late", t0.AddMinutes(1)), CancellationToken.None);

        IReadOnlyList<ComparisonRecord> page = await sut.SearchByCursorAsync(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "createdUtc",
            "asc",
            t0,
            "early",
            10,
            CancellationToken.None);

        page.Should().ContainSingle(r => r.ComparisonRecordId == "late");
    }

    [SkippableFact]
    public async Task CreateAsync_canonicalizes_dashed_run_ids_and_trims_comparison_record_id()
    {
        Guid left = Guid.Parse("88888888-8888-8888-8888-888888888888");
        Guid right = Guid.Parse("99999999-9999-9999-9999-999999999999");
        const string canonicalComparisonRecordId = "cmp-create-normalize";

        InMemoryComparisonRecordRepository sut = new();
        await sut.CreateAsync(
            Row(
                $"  {canonicalComparisonRecordId}  ",
                TimeProvider.System.UtcNowDateTime(),
                leftRun: left.ToString("D"),
                rightRun: $"  {right:N}  "),
            CancellationToken.None);

        ComparisonRecord? loaded = await sut.GetByIdAsync(canonicalComparisonRecordId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
        loaded.LeftRunId.Should().Be(left.ToString("N"));
        loaded.RightRunId.Should().Be(right.ToString("N"));
    }

    [SkippableFact]
    public async Task UpdateLabelAndTagsAsync_finds_row_when_create_used_padded_comparison_record_id()
    {
        const string canonicalComparisonRecordId = "cmp-update-trim-id";

        InMemoryComparisonRecordRepository sut = new();
        await sut.CreateAsync(
            Row($"  {canonicalComparisonRecordId}  ", TimeProvider.System.UtcNowDateTime()),
            CancellationToken.None);

        bool updated = await sut.UpdateLabelAndTagsAsync(
            canonicalComparisonRecordId,
            "normalized-label",
            null,
            CancellationToken.None);

        updated.Should().BeTrue();
        ComparisonRecord? loaded = await sut.GetByIdAsync(canonicalComparisonRecordId, CancellationToken.None);
        loaded!.Label.Should().Be("normalized-label");
    }

    [SkippableFact]
    public async Task GetByRunIdAsync_matches_when_stored_left_run_id_uses_dashed_guid_and_lookup_uses_n_format()
    {
        Guid runKey = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string canonicalRunId = runKey.ToString("N");
        string dashedPaddedRunId = $"  {runKey:D}  ";

        InMemoryComparisonRecordRepository sut = new();
        await sut.CreateAsync(
            Row("cmp-dashed-stored", TimeProvider.System.UtcNowDateTime(), leftRun: dashedPaddedRunId),
            CancellationToken.None);

        IReadOnlyList<ComparisonRecord> list =
            await sut.GetByRunIdAsync(canonicalRunId, CancellationToken.None);

        list.Should().ContainSingle(r => r.ComparisonRecordId == "cmp-dashed-stored");
        list[0].LeftRunId.Should().Be(canonicalRunId);
    }

    [SkippableFact]
    public async Task GetByIdAsync_finds_legacy_row_when_stored_comparison_record_id_has_padding()
    {
        const string canonicalComparisonRecordId = "cmp-legacy-pad-get";

        InMemoryComparisonRecordRepository sut = new();
        FieldInfo? itemsField = typeof(InMemoryComparisonRecordRepository).GetField(
            "_items",
            BindingFlags.Instance | BindingFlags.NonPublic);
        itemsField.Should().NotBeNull();
        List<ComparisonRecord> items = (List<ComparisonRecord>)itemsField!.GetValue(sut)!;
        items.Add(Row($"  {canonicalComparisonRecordId}  ", TimeProvider.System.UtcNowDateTime()));

        ComparisonRecord? loaded = await sut.GetByIdAsync(canonicalComparisonRecordId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ComparisonRecordId.Should().Be(canonicalComparisonRecordId);
    }

    [SkippableFact]
    public async Task GetByIdAsync_canonicalizes_dashed_run_ids_on_read()
    {
        Guid left = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid right = Guid.Parse("44444444-4444-4444-4444-444444444444");

        InMemoryComparisonRecordRepository sut = new();
        await sut.CreateAsync(
            Row("cmp-get-id", TimeProvider.System.UtcNowDateTime(), leftRun: left.ToString("D"), rightRun: right.ToString("D")),
            CancellationToken.None);

        ComparisonRecord? loaded = await sut.GetByIdAsync("cmp-get-id", CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.LeftRunId.Should().Be(left.ToString("N"));
        loaded.RightRunId.Should().Be(right.ToString("N"));
    }

    [SkippableFact]
    public async Task GetByExportRecordIdAsync_matches_left_or_right()
    {
        InMemoryComparisonRecordRepository sut = new();
        ComparisonRecord r = Row("c", TimeProvider.System.UtcNowDateTime());
        r.LeftExportRecordId = "exp-left";
        await sut.CreateAsync(r, CancellationToken.None);

        IReadOnlyList<ComparisonRecord> list =
            await sut.GetByExportRecordIdAsync("exp-left", CancellationToken.None);

        list.Should().ContainSingle(x => x.ComparisonRecordId == "c");
    }

    [SkippableFact]
    public async Task GetByExportRecordIdAsync_matches_when_stored_anchor_has_surrounding_whitespace()
    {
        InMemoryComparisonRecordRepository sut = new();
        ComparisonRecord r = Row("c-padded", TimeProvider.System.UtcNowDateTime());
        r.LeftExportRecordId = "  exp-left  ";
        await sut.CreateAsync(r, CancellationToken.None);

        IReadOnlyList<ComparisonRecord> list =
            await sut.GetByExportRecordIdAsync("exp-left", CancellationToken.None);

        list.Should().ContainSingle(x => x.ComparisonRecordId == "c-padded");
    }

    [SkippableFact]
    public async Task UpdateLabelAndTags_unknown_id_returns_false()
    {
        InMemoryComparisonRecordRepository sut = new();

        bool ok = await sut.UpdateLabelAndTagsAsync("missing", "l", [], CancellationToken.None);

        ok.Should().BeFalse();
    }

    [SkippableFact]
    public async Task CreateAsync_throws_when_cancelled()
    {
        InMemoryComparisonRecordRepository sut = new();
        CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = async () =>
            await sut.CreateAsync(Row("z", TimeProvider.System.UtcNowDateTime()), cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [SkippableFact]
    public async Task ReplacePayloadJsonForIntegrationTest_updates_payload()
    {
        InMemoryComparisonRecordRepository sut = new();
        ComparisonRecord r = Row("p", TimeProvider.System.UtcNowDateTime());
        await sut.CreateAsync(r, CancellationToken.None);

        sut.ReplacePayloadJsonForIntegrationTest("p", "{\"k\":1}");

        ComparisonRecord? loaded = await sut.GetByIdAsync("p", CancellationToken.None);

        loaded!.PayloadJson.Should().Be("{\"k\":1}");
    }

    [SkippableFact]
    public void ReplacePayloadJsonForIntegrationTest_missing_throws()
    {
        InMemoryComparisonRecordRepository sut = new();

        Action act = () => sut.ReplacePayloadJsonForIntegrationTest("nope", "{}");

        act.Should().Throw<InvalidOperationException>();
    }
}
