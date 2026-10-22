namespace ArchLucid.TestSupport;

/// <summary>
/// xUnit worker processes reuse the OS current directory across test class instances. If cwd points at a
/// directory that later gets deleted (<see cref="IDisposable"/> temp dirs, another fixture teardown), POSIX
/// <c>getcwd()</c> fails and <see cref="Directory.GetCurrentDirectory" /> throws
/// (<see cref="FileNotFoundException" />).
/// </summary>
public static class CliTestWorkingDirectory
{
    public static void EnsureReadableUsingExistingDirectory(string fallbackDirectoryThatExistsOnDisk)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fallbackDirectoryThatExistsOnDisk);

        bool currentReadable;

        try
        {
            string cwd = Directory.GetCurrentDirectory();

            currentReadable = Directory.Exists(cwd);
        }
        catch (Exception ex) when (ex is IOException
            or UnauthorizedAccessException
            or DirectoryNotFoundException
            or FileNotFoundException)
        {
            currentReadable = false;
        }

        if (!currentReadable)
            Directory.SetCurrentDirectory(fallbackDirectoryThatExistsOnDisk);
    }
}
