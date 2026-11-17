using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class MigrationCatalogMutexScopeTests
{
    private const string SampleConnectionString =
        "Server=(localdb)\\mssqllocaldb;Database=ArchLucidMutexTest;Integrated Security=true;TrustServerCertificate=true;";

    [SkippableFact]
    public void Acquire_Throws_WhenConnectionStringNull()
    {
        Action act = () => MigrationCatalogMutexScope.Acquire(null!, TimeSpan.FromSeconds(1));

        act.Should().Throw<ArgumentNullException>().WithParameterName("connectionString");
    }

    [SkippableFact]
    public void Dispose_IsIdempotent_AndReleasesMutexForSameCatalog()
    {
        using (MigrationCatalogMutexScope.Acquire(SampleConnectionString, TimeSpan.FromMinutes(1)))
        {
        }

        using (MigrationCatalogMutexScope second = MigrationCatalogMutexScope.Acquire(
                   SampleConnectionString,
                   TimeSpan.FromMinutes(1)))
        {
            second.Should().NotBeNull();
        }
    }

    [SkippableFact]
    public async Task Acquire_ThrowsTimeoutException_WhenSameCatalogAlreadyLocked()
    {
        // This is a named, cross-process mutex. Each test must use its own synthetic
        // catalog key so unrelated concurrent CI assemblies cannot occupy its lock.
        string isolatedConnectionString = SampleConnectionString.Replace(
            "ArchLucidMutexTest",
            $"ArchLucidMutexTest{Guid.NewGuid():N}",
            StringComparison.Ordinal);
        using ManualResetEventSlim holderReady = new(false);
        using ManualResetEventSlim releaseHolder = new(false);
        Exception? backgroundError = null;

        // Mutex ownership is thread-affine. Use a dedicated thread so busy parallel
        // test runners cannot starve the holder's ThreadPool work item.
        Task holder = Task.Factory.StartNew(
            () =>
            {
                try
                {
                    using (MigrationCatalogMutexScope.Acquire(isolatedConnectionString, TimeSpan.FromMinutes(1)))
                    {
                        holderReady.Set();
                        releaseHolder.Wait(TimeSpan.FromSeconds(30));
                    }
                }
                catch (Exception ex)
                {
                    backgroundError = ex;
                }
            },
            CancellationToken.None,
            TaskCreationOptions.LongRunning,
            TaskScheduler.Default);

        try
        {
            holderReady.Wait(TimeSpan.FromSeconds(10)).Should().BeTrue(
                "a dedicated holder thread should acquire this test's isolated catalog mutex");
            backgroundError.Should().BeNull();

            Action act = () => MigrationCatalogMutexScope.Acquire(
                isolatedConnectionString,
                TimeSpan.FromMilliseconds(200));

            act.Should().Throw<TimeoutException>()
                .WithMessage("*waiting for exclusive database migration lock*");
        }
        finally
        {
            releaseHolder.Set();
            await holder.WaitAsync(TimeSpan.FromSeconds(10));
        }

        backgroundError.Should().BeNull();
    }
}
