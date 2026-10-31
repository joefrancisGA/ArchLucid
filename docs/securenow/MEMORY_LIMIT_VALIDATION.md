# SecureNow container-constrained memory validation

The memory benchmark CI workflow runs 4 synthetic graph cohorts at 50, 200 and 500 nodes, three independent process repetitions each (36 cases), within Docker containers constrained to 512 MiB memory and one CPU. `report_securenow_memory_headroom.py` groups exactly matching cohort/node/edge/depth/prefix results, requires at least three complete untruncated observations, reports the sampled working-set spread, and compares the maximum observed RSS multiplied by a 1.5× planning factor with the explicitly configured 512 MiB budget.

These are sampled *process* working-set measurements. Docker enforces a cgroup limit but a successful execution does not prove measured peak RSS is below it by a guaranteed margin. The result is advisory, not a memory safety guarantee, statistical confidence interval, or worker admission policy. Test-host scheduling, GC, and synthetic topology can affect results. Missing repeated evidence is an error, and no production memory limits or scaling rules change.

Do not treat the 512 MiB CI test limit as SecureNow's deployed worker limit. An operational recommendation requires separate measurement using the actual deployed worker configuration and realistic graph distributions.
