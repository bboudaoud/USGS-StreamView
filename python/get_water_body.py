import json
import sys

from pathlib import Path
from tqdm import tqdm

import usgs_reader
import usgs_types

REMOVE_INACTIVE = False

# WATER_BODY_TYPES = set([
#     "BRANCH",
#     "BROOK",
#     "CHAN",
#     "CHANNEL",
#     "CREEK",
#     "CR",
#     "CK",
#     "DCH",
#     "DITCH",
#     "DRAFT",
#     "FORK",
#     "LAKE",
#     "LK",
#     "RIVER",
#     "RIV",
#     "R",
#     "RUN",
#     "SWAMP",
#     "STORM DRAIN",
# ])

TYPE_RENAMES = {
    "CR": "CREEK",
    "CK": "CREEK",
    "CHAN": "CHANNEL",
    "DCH": "DITCH",
    "LK": "LAKE",
    "RIV": "RIVER",
    "R": "RIVER",
}

LOC_SPLITTERS = [
    "ABOVE",
    "AT",
    "BELOW",
    "BL",
    "NEAR",
    "NR",
]

# Validate path
file_path = Path(sys.argv[1])
if not file_path.exists():
    print(f"Provided input file does not exist! {file_path}")
    exit()
if not file_path.suffix == ".json":
    print(f"Provided input file must be a JSON!")
    exit()

# Load site list from path
siteList = usgs_types.load_json_sites(
    file_path=file_path,
    valid_var_names=["Gage height", "Streamflow", "Temperature, water"],
)

if REMOVE_INACTIVE:
    # Filter site list
    to_remove = []
    orig_count = len(siteList)
    for idx, site in tqdm(enumerate(siteList), desc="Checking active", total=orig_count):
        reader = usgs_reader.GageSiteReader(id = site.id)
        if not reader.check_active():
            to_remove.append(site)

    print(f"Removing {len(to_remove)} / {orig_count} ({100*len(to_remove)/orig_count:.2f}%) inactive gauges!")
    # Remove these unused items
    for s in to_remove:
        siteList.remove(s)
        print(f"\t{s}")

# Water body based storage
water_bodies = {}
# Discover water bodies
for site in siteList:
    # These are what we want
    water_body = None
    location = None

    # Search for known water body types
    # first_idx = 1e9
    # for t in WATER_BODY_TYPES:
    #     search_str = f" {t.upper()} "
    #     if search_str in site.name.upper():
    #         # Check for first index
    #         idx = site.name.index(search_str)
    #         if idx > first_idx:
    #             continue
    #         first_idx = idx
    #         # Rename if needed
    #         if t in TYPE_RENAMES:
    #             t = TYPE_RENAMES[t]
    #         # Get the water body name here
    #         water_body = site.name.split(search_str)[0] + f" {t}"
    #         location = "".join(site.name.split(search_str)[1:])

    # Try to get using splitter
    first_idx = 1e9
    if water_body is None:
        for loc_split in LOC_SPLITTERS:
            split_str = f" {loc_split} "
            if split_str in site.name:
                # Check if this is the first occurance
                idx = site.name.index(split_str)
                if idx > first_idx:
                    # If not continue
                    continue
                first_idx = idx
                # Update the water body
                water_body = site.name.split(split_str)[0]
                location = split_str[1:] + split_str.join(site.name.split(split_str)[1:])

    # Check if we failed
    if water_body is None:
        print(f"Unknown water body type for: {site}")
        continue

    # Track these
    if not water_body in water_bodies:
        water_bodies[water_body] = {}
    water_bodies[water_body][location] = site.__dict__.copy()

# Print results
# for b in water_bodies:
#     print(b)
#     for loc in water_bodies[b]:
#         print(f"\t{loc}")
#         for var in water_bodies[b][loc]["vars"]:
#             print(f"\t\t{var}")

# Sort
water_bodies = dict(sorted(water_bodies.items()))
# for body in water_bodies:
#     water_bodies[body] = dict(sorted(water_bodies[body].items()))

# Write to file
output_path = file_path.stem + "_sites.json"
with open(output_path, "w") as f:
    json.dump(water_bodies, f, indent=4)
print(f"Done!")
