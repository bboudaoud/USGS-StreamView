import requests
from typing import Any

import usgs_types


class GageSiteReader:
    def __init__(self, id: str):
        # So far this is always true (that I've seen)
        assert id.isnumeric()
        self.id = id

        # Get info for this site (using height request for now)
        self.info: usgs_types.SiteInfo | None = None
        COMBO_URL = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={self.id}&period=P1D&parameterCd=00060,00065,00010"
        series = self._get_all_ts(COMBO_URL)
        for s in series:
            if self.info is None:
                self.info = s[0]
            elif s[0].id == self.info.id:
                # Combine fields
                self.info.vars += s[0].vars

    def check_active(self, inLastDays: int = 14) -> bool:
        """Make sure at least one gauge reported is active here"""
        COMBO_URL = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={self.id}&period=P{inLastDays}D&parameterCd=00060,00065,00010"
        series = self._get_all_ts(COMBO_URL)
        return len(series[0][1]) > 0

    def get_flow(self, periodDays: int = 1) -> tuple[list[str], list[float]]:
        FLOW_URL = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={self.id}&period=P{periodDays}D&parameterCd=00060"
        return self._simple_ts(FLOW_URL)

    def get_height(self, periodDays: int = 1) -> tuple[list[str], list[float]]:
        HEIGHT_URL = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={self.id}&period=P{periodDays}D&parameterCd=00065"
        return self._simple_ts(HEIGHT_URL)

    def get_temp(self, periodDays: int = 1) -> tuple[list[str], list[float]]:
        TEMP_URL = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={self.id}&period=P{periodDays}D&parameterCd=00010"
        return self._simple_ts(TEMP_URL)

    def _simple_ts(self, url: str) -> tuple[list[str], list[float]]:
        """Quick method to choke down results from below"""
        info, ts = self._get_single_ts(url)
        return ts.times, ts.values

    def _get_all_ts(self, url: str) -> list[tuple[usgs_types.SiteInfo | None, usgs_types.TimeSeries]]:
        # Make request and process response
        resp = requests.get(url)
        if not resp.ok:
            raise ValueError(f"Invalid response: {resp}")
        # Get JSON contents
        data = resp.json()

        # Check for empty time series here
        if self._get_ts_count(data) == 0:
            return [(None, usgs_types.TimeSeries())]

        # Assume its the first time series as a dictionary
        series = []
        for ts in data["value"]["timeSeries"]:
        # Return as our custom types
            series.append((usgs_types.SiteInfo.from_dict(ts), usgs_types.TimeSeries.from_dict(ts)))
        return series

    def _get_single_ts(self, url: str) -> tuple[usgs_types.SiteInfo | None, usgs_types.TimeSeries]:
        series = self._get_all_ts(url)
        assert len(series) == 1
        # Return as our custom types
        return series[0][0], series[0][1]


    def _get_ts_count(self, data: dict[str, Any]) -> int:
        return len(data["value"]["timeSeries"])