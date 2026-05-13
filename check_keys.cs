using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        var catalogCode = File.ReadAllText(@"c:\ArchLucid\ArchLucid\ArchLucid.Core\Configuration\ConfigurationKeyCatalog.cs");
        var docText = File.ReadAllText(@"c:\ArchLucid\ArchLucid\docs\library\CONFIGURATION_REFERENCE.md");

        var matches = Regex.Matches(catalogCode, @"E\([^,]*, ""([^""]+)""");
        foreach (Match match in matches)
        {
            var key = match.Groups[1].Value;
            if (!docText.Contains("`" + key + "`"))
            {
                Console.WriteLine("Missing in doc: " + key);
            }
        }
    }
}