# Statistical bug discovery

The bug-hunt program should optimize **unique meaningful defects found per unit of effort**, not raw bug count.

`scripts/assurance/qa_discovery_metrics.py` reports:

- confirmed and unique defects;
- duplicate rate;
- unique defects per hour;
- cost per unique defect;
- credibility-defect count;
- unique yield by discoverer/reviewer;
- risk-weighted defect points by QA zone;
- zones with zero unique defects in the supplied hunt window.

## Interpretation

A falling defect yield is useful evidence that a sampled zone is becoming saturated. It is not proof that no defects remain. Compare multiple independent hunt methods and retain severity/credibility weighting so a hundred cosmetic defects do not dominate one trust-destroying error.

The defect ledger should preserve `discoveredBy`, zone, severity, duplicate linkage, time/cost and whether the defect is credibility-relevant.
