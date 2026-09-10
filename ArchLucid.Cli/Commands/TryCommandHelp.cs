namespace ArchLucid.Cli.Commands;

/// <summary>Help text for <see cref="TryCommand" /> — Career vs Rehearsal door vocabulary (AS-083).</summary>
internal static class TryCommandHelp
{
    internal const string CareerDoorRequiresRealAoaiGateMessage =
        "Career door (--real) requires ARCHLUCID_REAL_AOAI=1 for local operator loops (ADR 0033), or pass hosted smoke flags such as --staging / --api-base-url.";

    internal static void WriteHelp(TryCommandExecutionDoor? selectedDoor = null)
    {
        Console.WriteLine("archlucid try — first-value smoke with explicit Career / Rehearsal doors (AS-083).");
        Console.WriteLine();
        Console.WriteLine(
            "Usage: archlucid try [--rehearse | --real] [--strict-real] [--help] " +
            "[real-mode smoke flags...]");
        Console.WriteLine();
        Console.WriteLine($"  --rehearse   {TryCommandExecutionDoorCopy.RehearsalFlagHelp}");
        Console.WriteLine($"  --real       {TryCommandExecutionDoorCopy.CareerFlagHelp}");
        Console.WriteLine("  --strict-real  Fail when hosted smoke cannot prove Real token usage (Career door only).");
        Console.WriteLine($"  (default)    {TryCommandExecutionDoorCopy.DefaultDoorHelp}");
        Console.WriteLine();
        Console.WriteLine(
            "Smoke flags forward to `archlucid real-mode smoke` (hosted API only — local docker try was retired). "
            + "Rehearsal uses Simulator labeling; Career targets Real execute.");
        Console.WriteLine("Examples:");
        Console.WriteLine("  archlucid try --rehearse --staging");
        Console.WriteLine("  ARCHLUCID_REAL_AOAI=1 archlucid try --real --staging");
        Console.WriteLine("  archlucid second-run SECOND_RUN.toml   # adoption path with your own brief");
        Console.WriteLine("  archlucid trial smoke --org <name> --email <email> --staging");

        if (selectedDoor is not null)
        {
            Console.WriteLine();
            Console.WriteLine(
                $"Selected door: {TryCommandExecutionDoorCopy.LabelFor(selectedDoor.Value)} ({selectedDoor.Value}).");
        }
    }
}
