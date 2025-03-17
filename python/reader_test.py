
import matplotlib.pyplot as plt

import usgs_reader

# Active
GAGE_ID = "02011400"

# Not active
# GAGE_ID = "01616000"


reader = usgs_reader.GageSiteReader(GAGE_ID)
active = reader.check_active()
print("Is Active = ", active)
if active:
    print(f"Reader Info:\n{reader.info.__dict__}")

# Check active

# Quick plot
time, flow = reader.get_flow(10)
plt.plot(time, flow)
plt.show()