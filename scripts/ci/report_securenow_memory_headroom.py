#!/usr/bin/env python3
"""Advisory SecureNow memory cohort repeatability and memory-limit report."""
import argparse
import json
import math
from pathlib import Path

def analyze(directory, limit_bytes, multiplier=1.5):
    if not 1 <= multiplier <= 4 or not 64*1024*1024 <= limit_bytes <= 64*1024**3:
        raise ValueError("Invalid memory budget")
    files=sorted(Path(directory).glob("*.json"))
    if len(files)>200: raise ValueError("Excessive benchmark artifacts")
    groups={}
    for file in files:
        if file.stat().st_size>131072: raise ValueError("Oversized artifact")
        item=json.loads(file.read_text())
        if item.get("schemaVersion")!=1 or item.get("benchmarkKind")!="DEDICATED_PROCESS_SYNTHETIC_GRAPH":
            raise ValueError("Unsupported artifact")
        s=item["sample"]
        key=(s["Cohort"],s["NodeCount"],s["EdgeCount"],s["HopDepth"],s["PrefixCount"])
        value=s["SampledWorkingSetBytes"]
        if s["MeasurementScope"]!="DEDICATED_PROCESS_SAMPLED" or s["Truncated"] or type(value)!=int or value<0:
            continue
        groups.setdefault(key,[]).append(value)
    results=[]
    for key, values in sorted(groups.items()):
        if len(values)<3: continue
        values.sort()
        worst=values[-1]
        budget=math.ceil(worst*multiplier)
        results.append({"cohort":key[0],"nodes":key[1],"edges":key[2],
                        "depth":key[3],"prefixes":key[4],"repetitions":len(values),
                        "observedMinBytes":values[0],"observedMaxBytes":worst,
                        "sampledSpreadBytes":worst-values[0],
                        "advisoryBudgetBytes":budget,
                        "headroomBytes":limit_bytes-budget,
                        "withinAdvisoryLimit":budget<=limit_bytes})
    return {"schemaVersion":1,"evidenceStatus":"ADVISORY_SAMPLED_RSS_NOT_TRUE_PEAK",
            "configuredWorkerMemoryLimitBytes":limit_bytes,"headroomMultiplier":multiplier,
            "results":results,"validCohorts":len(results),
            "limitations":"Repeated sampled working-set values are not verified peak RSS; limit and safety factor are planning assumptions. No automatic admission change."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--directory",required=True)
    p.add_argument("--worker-limit-bytes",type=int,required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()
    result=analyze(a.directory,a.worker_limit_bytes)
    path=Path(a.output);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(result,indent=2)+"\n")
    if not result["validCohorts"]:
        raise SystemExit("Insufficient repeated valid cohorts")
if __name__=="__main__":
    main()
