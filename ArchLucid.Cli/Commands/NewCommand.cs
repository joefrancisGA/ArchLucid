namespace ArchLucid.Cli.Commands;

internal static class NewCommand
{
    public static Task<int> RunAsync(string projectName)
    {
        Console.WriteLine("Creating ArchiForge project " + projectName);

        ArchLucidProjectScaffolder.ScaffoldOptions scaffoldOptions = new()
        {
            ProjectName = projectName,
            BaseDirectory = null,
            OverwriteExistingFiles = true,
            IncludeTerraformStubs = true
        };

        ArchLucidProjectScaffolder.CreateProject(scaffoldOptions);

        return Task.FromResult(0);
    }
}
