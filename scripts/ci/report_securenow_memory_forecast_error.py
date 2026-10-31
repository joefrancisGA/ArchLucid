#!/usr/bin/env python3
"""Advisory leave-one-size-out memory forecast errors and cohort-specific headroom."""
import argparse
import json
import math
from pathlib import Path

def evaluate(directory, limit_bytes, base_multiplier=1.5):
    if not isinstance(limit_bytes, int) or limit_bytes < 64*1024**2 or not 1 <= base_multiplier <= 4:
        raise ValueError("Invalid memory limit or factor")
    groups = {}
    files = sorted(Path(directory).glob("*.json"))
    if len(files) > 200:
        raise ValueError("Too many artifacts")
    for file in files:
        if file.stat().st_size > 131072:
            raise ValueError("Oversized artifact")
        record = json.loads(file.read_text(encoding="utf-8"))
        if record.get("benchmarkKind") != "DEDICATED_PROCESS_SYNTHETIC_GRAPH":
            continue  # Ignore summary outputs in the same artifact folder.
        if record.get("schemaVersion") != 1:
            raise ValueError("Unsupported benchmark schema")
        s = record["sample"]
        cohort = s["Cohort"]
        nodes, edges, depth, prefixes = (s[k] for k in ("NodeCount","EdgeCount","HopDepth","PrefixCount"))
        rss = s["SampledWorkingSetBytes"]
        if s["Truncated"] or s["MeasurementScope"] != "DEDICATED_PROCESS_SAMPLED":
            continue
        if not isinstance(cohort, str) or not cohort or any(type(v) is not int or v < 0 for v in (nodes,edges,depth,prefixes,rss)):
            raise ValueError("Invalid cohort measurements")
        groups.setdefault((cohort,nodes,edges,depth,prefixes), []).append(rss)
    series = {}
    for (cohort,nodes,edges,depth,prefixes), values in groups.items():
        if len(values) < 3:
            continue
        series.setdefault(cohort, []).append({"nodes":nodes,"edges":edges,"depth":depth,
                         "prefixes":prefixes,"observedMaxBytes":max(values),
                         "observedMinBytes":min(values),"repetitions":len(values)})
    output = []
    for cohort, sizes in sorted(series.items()):
        sizes.sort(key=lambda s:(s["nodes"],s["edges"],s["prefixes"]))
        # A two-size calibration cannot provide an independent out-of-sample error.
        if len(sizes) < 3 or len({s["nodes"] for s in sizes}) < 3:
            output.append({"cohort":cohort,"status":"INSUFFICIENT_SIZE_COHORTS"})
            continue
        errors = []
        for i in range(1,len(sizes)):
            earlier, observed = sizes[i-1], sizes[i]
            # Conservative no-extrapolation rule: we can evaluate this historical
            # prediction error, but cannot publish a current upper bound from it.
            estimate = earlier["observedMaxBytes"]
            actual = observed["observedMaxBytes"]
            errors.append({"fromNodes":earlier["nodes"],"toNodes":observed["nodes"],
                           "predictedBytes":estimate,"observedBytes":actual,
                           "absoluteErrorBytes":abs(actual-estimate),
                           "absolutePercentageError": None if actual == 0 else round(100*abs(actual-estimate)/actual,3),
                           "underpredictionRatio":None if estimate==0 else round(actual/estimate,6)})
        ratios = [e["underpredictionRatio"] for e in errors if e["underpredictionRatio"] is not None]
        if len(ratios)!=len(errors):
            output.append({"cohort":cohort,"status":"ZERO_PREDICTION_NO_HEADROOM_RECOMMENDATION","errors":errors})
            continue
        factor = min(4.0,max(base_multiplier,max(ratios)))
        largest=max(sizes,key=lambda s:s["nodes"])
        budget=math.ceil(largest["observedMaxBytes"]*factor)
        output.append({"cohort":cohort,"status":"HISTORICAL_BACKTEST_ADVISORY_ONLY",
                       "errors":errors,"recommendedHeadroomMultiplier":round(factor,6),
                       "latestObservedMaxBytes":largest["observedMaxBytes"],
                       "advisoryPlanningBudgetBytes":budget,
                       "withinConfiguredLimit":budget<=limit_bytes,
                       "headroomBytes":limit_bytes-budget})
    return {"schemaVersion":1,"status":"SAMPLED_RSS_HISTORICAL_BACKTEST_NOT_PRODUCTION_CALIBRATION",
            "configuredMemoryLimitBytes":limit_bytes,"cohorts":output,
            "limitations":"Earlier-size hold-constant estimates are retrospective stress tests, not forecasts for unseen larger sizes. Capped headroom multipliers and sampled RSS cannot guarantee memory safety."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--directory",required=True)
    p.add_argument("--worker-limit-bytes",type=int,required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()
    report=evaluate(a.directory,a.worker_limit_bytes)
    out=Path(a.output)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    if not any(c["status"]=="HISTORICAL_BACKTEST_ADVISORY_ONLY" for c in report["cohorts"]):
        raise SystemExit("Insufficient data for headroom backtest")

if __name__=="__main__":
    main()
