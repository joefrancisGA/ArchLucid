using System.Globalization;

namespace ArchLucid.AzureLabGenerator;

public static class AzureLabProgram
{
    public static int Run(IReadOnlyList<string> args)
    {
        try
        {
            AzureLabCommandLineParser parser = new();
            AzureLabCommandLineOptions options = parser.Parse(args);
            AzureLabInventoryGenerator inventoryGenerator = new();
            AzureLabScenarioCatalog catalog = new(inventoryGenerator);
            AzureLabPackageWriter packageWriter = new();
            AzureLabPackageFileWriter fileWriter = new(packageWriter);
            AzureLabPackageGenerator packageGenerator = new(catalog, fileWriter);

            foreach (AzureLabPackageOutput output in packageGenerator.Generate(options))
            {
                Console.WriteLine(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Wrote {0} ({1} resources, {2} bytes, sha256 {3})",
                        Path.GetFileName(output.Path),
                        output.ResourceCount,
                        output.ByteCount,
                        output.Sha256));
            }

            return 0;
        }
        catch (AzureLabCommandLineHelpException)
        {
            Console.WriteLine(AzureLabCommandLineParser.Usage);

            return 0;
        }
        catch (Exception exception) when (exception is AzureLabCommandLineException or ArgumentException)
        {
            Console.Error.WriteLine(exception.Message);

            return 1;
        }
    }
}
