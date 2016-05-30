# setlist_visualizer
Visualize Concert Data

----------------------------------------------------------------------------------------------

**Table of Contents**

- [Summary](#summary)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Assumptions](#assumptions)
- [Known Issues](#known-issues)


# Summary
[setlist.fm](http://www.setlist.fm) contains a myriad of concert data for artist all over the world.
The goal of this project is to use their public api to retrieve and visualize concert data using Python and JavaScript.

# Requirements
1. Python >= 3.4
2. Run `pip install -r requirements.txt` for dependencies
3. MongoDB running locally on port 27017

# Getting Started
Initial implementation - will change in the future.

1. cd ~/setlist_visualizer
2. python get_setlists.py grateful-dead
3. python get_setlists.py allman-brothers
4. python get_setlists.py dave-matthews-band
5. python app.py

Open a web browser and navigate to http://localhost:5000/.
Something like this should render:
![alt text](screenshots/home.png "setlist_visualizer homepage")


# Assumptions
1. The project is currently a work in progress.

# Known Issues
1. Currently only tested on Mac OS X 10.10.5 with Chrome Version 50.0.2661.102 (64-bit)
2. Only column-basic chart is fully implemented - other charts are placeholders.
