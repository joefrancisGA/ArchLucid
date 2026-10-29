#!/usr/bin/env python3
"""Opt-in read-only Azure Monitor collector. Uses an existing Azure CLI login/OIDC session."""
import argparse
import datetime as dt
import json
import math
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

RESOURCE = re.compile(r"^/subscriptions/[0-9a-f-]{36}/resourceGroups/[^/]+/providers/Microsoft\.Sql/servers/[^/]+/databases/ArchLucidCapacityTest_[^/]+$", re.I)
METRICS = {"cpu_percent", "dtu_consumption_percent", "storage_percent", "log_write_percent"}

def timestamp(value):
    date = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if date.utcoffset() != dt.timedelta(0):
        raise ValueError("UTC timestamps required")
    return date

def normalize(payload, resource_id, metric, start, end):
    if not isinstance(payload, dict) or len(payload.get("value", [])) != 1:
        raise ValueError("Expected exactly one Azure metric")
    item = payload["value"][0]
    if item.get("name", {}).get("value", "").casefold() != metric.casefold():
        raise ValueError("Returned metric differs from request")
    series = item.get("timeseries", [])
    if len(series) != 1 or series[0].get("metadatavalues"):
        raise ValueError("Dimensioned or ambiguous metric series not supported")
    points = []
    for sample in series[0].get("data", []):
        number = sample.get("average")
        if number is None:
            continue
        when = timestamp(sample["timeStamp"])
        if not start <= when <= end or not isinstance(number, (int, float)) or isinstance(number, bool) or not math.isfinite(number) or number < 0:
            raise ValueError("Invalid Azure metric observation")
        points.append({"timestampUtc": when.isoformat().replace("+00:00","Z"), "value": number})
    if not 2 <= len(points) <= 1440 or any(
        points[i]["timestampUtc"] >= points[i+1]["timestampUtc"] for i in range(len(points)-1)):
        raise ValueError("Insufficient or unordered Azure metric observations")
    return {"schemaVersion":1, "scope":"SQL_SERVER_RESOURCE", "resourceId":resource_id,
            "metricName":metric, "startUtc":start.isoformat().replace("+00:00","Z"),
            "endUtc":end.isoformat().replace("+00:00","Z"), "observations":points,
            "evidenceStatus":"AZURE_MONITOR_AVERAGE_RESOURCE_METRIC_NOT_QUERY_CPU"}

def collect(resource_id, metric, start, end):
    if not RESOURCE.fullmatch(resource_id) or metric not in METRICS or not dt.timedelta(0) < end-start <= dt.timedelta(hours=24):
        raise ValueError("Approved Azure SQL test resource, metric and window required")
    subscription = resource_id.split("/")[2]
    token_response = subprocess.run(
        ["az","account","get-access-token","--subscription",subscription,
         "--resource","https://management.azure.com/","--output","json"],
        check=True,capture_output=True,text=True,timeout=20)
    token = json.loads(token_response.stdout)["accessToken"]
    query = urllib.parse.urlencode({"api-version":"2018-01-01","metricnames":metric,
                                     "timespan":start.isoformat()+"/"+end.isoformat(),
                                     "interval":"PT1M","aggregation":"Average"})
    url = "https://management.azure.com" + resource_id + "/providers/Microsoft.Insights/metrics?" + query
    request = urllib.request.Request(url,headers={"Authorization":"Bearer "+token,"Accept":"application/json"})
    with urllib.request.urlopen(request,timeout=30) as response:
        body=response.read(262145)
    if len(body)>262144: raise ValueError("Oversized Azure Monitor response")
    return normalize(json.loads(body),resource_id,metric,start,end)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--resource-id",required=True)
    p.add_argument("--metric",choices=sorted(METRICS),default="cpu_percent")
    p.add_argument("--start",required=True)
    p.add_argument("--end",required=True)
    p.add_argument("--output",required=True)
    a=p.parse_args()
    result=collect(a.resource_id,a.metric,timestamp(a.start),timestamp(a.end))
    out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print("Wrote read-only Azure Monitor observations; bearer token not exported.")

if __name__=="__main__":
    main()
