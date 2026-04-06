using BenchmarkDotNet.Running;

namespace ArchLucid.Benchmarks;

internal static class Program
{
    private static void Main(string[] args)
    {
        _ = BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
    }
}
