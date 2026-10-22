# QA zone saturation

A QA zone is **saturated for the current hunt method/window** when repeated passes produce no new unique defects or mostly duplicates.

Track per zone:

- unique defects;
- duplicate defects;
- credibility defects;
- risk-weighted defect points;
- hours and model/tool cost;
- discoverer/method;
- consecutive clean passes.

## Stopping rule

Do not stop merely because one pass is clean. Prefer stopping or reducing frequency when:

1. multiple passes by at least two materially different methods produce zero or near-zero unique high-value defects;
2. capture-recapture does not suggest a large obvious unseen population (with its assumptions disclosed);
3. credibility tripwires, semantic corpus and targeted mutation remain green;
4. recent code changes have not materially altered the zone.

A new high/critical or credibility defect immediately resets saturation for that zone.
