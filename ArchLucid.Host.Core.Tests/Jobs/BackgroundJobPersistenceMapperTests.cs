using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Jobs;

[Trait("Category", "Unit")]
public sealed class BackgroundJobPersistenceMapperTests
{
    [Fact]
    public void ToInfo_returns_null_for_null_row()
    {
        BackgroundJobPersistenceMapper.ToInfo(null).Should().BeNull();
    }

    [Fact]
    public void ToInfo_maps_known_state_case_insensitively()
    {
        DateTimeOffset created = DateTimeOffset.UtcNow;
        BackgroundJobRow row = new()
        {
            JobId = "job-1",
            State = "succeeded",
            CreatedUtc = created,
            RetryCount = 1,
            MaxRetries = 3,
            FileName = "export.zip",
            ContentType = "application/zip",
            Error = "none",
        };

        BackgroundJobInfo? info = BackgroundJobPersistenceMapper.ToInfo(row);

        info.Should().NotBeNull();
        info!.JobId.Should().Be("job-1");
        info.State.Should().Be(BackgroundJobState.Succeeded);
        info.CreatedUtc.Should().Be(created);
        info.RetryCount.Should().Be(1);
        info.MaxRetries.Should().Be(3);
        info.FileName.Should().Be("export.zip");
        info.ContentType.Should().Be("application/zip");
        info.Error.Should().Be("none");
    }

    [Fact]
    public void ToInfo_falls_back_to_failed_for_unknown_state()
    {
        BackgroundJobRow row = new()
        {
            JobId = "job-2",
            State = "mystery",
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        BackgroundJobInfo? info = BackgroundJobPersistenceMapper.ToInfo(row);

        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Failed);
    }
}
