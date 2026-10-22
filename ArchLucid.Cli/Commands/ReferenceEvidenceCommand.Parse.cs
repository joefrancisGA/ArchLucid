namespace ArchLucid.Cli.Commands;

internal static partial class ReferenceEvidenceCommand
{
    private sealed class ReferenceEvidenceArgs
    {
        public string? RunId
        {
            get;
            private init;
        }

        public Guid? TenantId
        {
            get;
            private init;
        }

        public string? OutputDirectory
        {
            get;
            private init;
        }

        public bool IncludeDemo
        {
            get;
            private init;
        }

        public bool IsValid => RunId is not null ^ TenantId is not null;

        public static ReferenceEvidenceArgs Parse(string[] args)
        {
            string? run = null;
            Guid? tenant = null;
            string? output = null;
            bool includeDemo = false;

            for (int i = 0; i < args.Length; i++)
            {
                string a = args[i];

                if (string.Equals(a, "--run", StringComparison.Ordinal) && i + 1 < args.Length)
                {
                    run = args[++i];

                    continue;
                }

                if (string.Equals(a, "--tenant", StringComparison.Ordinal) && i + 1 < args.Length
                                                                           && Guid.TryParse(args[++i], out Guid tid))
                {
                    tenant = tid;

                    continue;
                }

                if (string.Equals(a, "--out", StringComparison.Ordinal) && i + 1 < args.Length)
                {
                    output = args[++i];

                    continue;
                }

                if (string.Equals(a, "--include-demo", StringComparison.Ordinal))
                {
                    includeDemo = true;
                }
            }

            return new ReferenceEvidenceArgs { RunId = run, TenantId = tenant, OutputDirectory = output, IncludeDemo = includeDemo };
        }
    }
}
