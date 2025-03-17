import json

from pathlib import Path
from typing import Any

class TimeSeries:
    def __init__(self, times: list[str] = [], values: list[float] = []):
        assert len(times) == len(values)
        self.times = times
        self.values = values

    def __len__(self) -> int:
        return len(self.times)

    @classmethod
    def from_dict(clas, data: dict[str, Any]) -> "TimeSeries":
        ts = data["values"][0]["value"]
        times = [pt["dateTime"] for pt in ts]
        values = [float(pt["value"]) for pt in ts]
        return TimeSeries(times, values)


class SiteInfo:
    def __init__(self, name: str, id: str, variables: list[str] = []):
        self.name = name
        self.id = id
        self.vars = variables

    def __str__(self) -> str:
        return self.name

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SiteInfo":
        if "sourceInfo" not in data:
            raise ValueError("Cannor parse!")
        return cls(
            name=data["sourceInfo"]["siteName"],
            id=data["sourceInfo"]["siteCode"][0]["value"],
            variables=[data["variable"]["variableName"]],
        )


def load_json_sites(
    file_path: str | Path, valid_var_names: list[str] | None = None
) -> list[SiteInfo]:
    with open(file_path, "r") as f:
        data = json.load(f)

    # Unpack outer
    if "value" not in data:
        raise ValueError('Unexpected format! (No outer "value")')
    if "timeSeries" not in data["value"]:
        raise ValueError('Unexpected format! (No inner "timeSeries")')

    sites: list[SiteInfo] = []
    for d in data["value"]["timeSeries"]:
        # Get info
        info = SiteInfo.from_dict(d)
        # Check var
        if valid_var_names is not None:
            valid = False
            for valid_str in valid_var_names:
                # Check if this is a valid variable
                if valid_str in info.vars[0]:
                    valid = True
                    break
            if not valid:
                # Skip this variable
                continue
        # Check if we already have this
        alreadyExists = False
        for site in sites:
            if site.name == info.name:
                alreadyExists = True
                if info.vars[0] not in site.vars:
                    site.vars.append(info.vars[0])
        # Add this to list if it doesn't already exist
        if not alreadyExists:
            sites.append(info)

    return sites
