"use strict";


// Divs
const PLOT_DIV_NAME = 'plotDiv';
// const plotDiv = document.getElementById(PLOT_DIV_NAME);
const mapDiv = document.getElementById('mapDiv');
const weatherDiv = document.getElementById('weatherDiv');

function _latestReading(values) {
    if (values == undefined || values.length == 0) {
        return undefined;
    }
    return values[values.length - 1];
}

function _wrapPlotTitle(title, maxLineLength) {
    const words = title.split(" ");
    const lines = [];
    var line = "";

    words.forEach(word => {
        const nextLine = line == "" ? word : `${line} ${word}`;
        if (line != "" && nextLine.length > maxLineLength) {
            lines.push(line);
            line = word;
        }
        else {
            line = nextLine;
        }
    });
    if (line != "") {
        lines.push(line);
    }
    return lines.join("<br>");
}

function updateCurrentConditions(data) {
    // eslint-disable-next-line no-unused-vars
    const [_siteName, _siteLoc, flowValues, heightValues, tempValues] = data;

    const flowReading = _latestReading(flowValues);
    const heightReading = _latestReading(heightValues);
    const tempReading = _latestReading(tempValues);

    const currFlow = document.getElementById("currentCondFlow");
    const currHeight = document.getElementById("currentCondHeight");
    const currTemp = document.getElementById("currentCondTemp");
    const currTime = document.getElementById("currentCondTime");
    const flowRow = document.getElementById("currentCondFlowRow");
    const heightRow = document.getElementById("currentCondHeightRow");
    const tempRow = document.getElementById("currentCondTempRow");

    currFlow.textContent = "";
    currHeight.textContent = "";
    currTemp.textContent = "";
    currTime.textContent = "--";

    if (flowReading != undefined) {
        currFlow.textContent = Math.round(parseFloat(flowReading.value) * 10) / 10;
        flowRow.style.display = "";
    }
    else {
        flowRow.style.display = "none";
    }
    if (heightReading != undefined) {
        currHeight.textContent = Math.round(parseFloat(heightReading.value) * 100) / 100;
        heightRow.style.display = "";
    }
    else {
        heightRow.style.display = "none";
    }
    if (tempReading != undefined) {
        const tempF = parseFloat(tempReading.value) * (9 / 5) + 32;
        currTemp.textContent = Math.round(tempF * 100) / 100;
        tempRow.style.display = "";
    }
    else {
        tempRow.style.display = "none";
    }

    // Use the most recent timestamp among available series
    var latestTime = undefined;
    [flowReading, heightReading, tempReading].forEach(reading => {
        if (reading == undefined || reading.dateTime == undefined) {
            return;
        }
        const t = new Date(reading.dateTime);
        if (latestTime == undefined || t > latestTime) {
            latestTime = t;
        }
    });
    if (latestTime != undefined) {
        currTime.textContent = latestTime.toLocaleString();
    }
}

function plotData(div, data, printMissing = false) {
    // Transform the data
    // eslint-disable-next-line no-unused-vars
    const [siteName, _, flowValues, heightValues, tempValues] = data;

    // Storage for this method
    var traces = [];
    var hasTemp = tempValues.length > 0;
    // Base figure layout
    var layout = {
        title: siteName,
        yaxis: { title: 'Streamflow (cfs)', automargin: true },
        legend: {
            orientation: 'h',
            x: 0.5,
            y: 1,
            xanchor: 'center',
            yanchor: 'bottom',
        },
        margin: { t: 100 },
    };
    if (heightValues.length > 0) {
        // Only add the overlaid right axis when height data exists
        layout.yaxis3 = {
            title: 'Gage Height (ft)',
            overlaying: 'y',
            side: 'right',
            automargin: true,
        };
    }
    var config = {
        responsive: true,
    };

    // Create Plotly figure for flow and height
    if (flowValues.length > 0) {
        traces.push({
            x: flowValues.map(v => v.dateTime),
            // USGS returns values as strings; coerce so autorange covers true extremes
            y: flowValues.map(v => parseFloat(v.value)),
            name: 'Streamflow (cfs)',
            type: 'scatter',
            mode: 'lines',
            xaxis: 'x',
            yaxis: 'y',
            marker: { color: 'red' },
        });
    }
    else if (printMissing) {
        console.log(`No flow for ${siteName}`);
    }

    if (heightValues.length > 0) {
        traces.push({
            x: heightValues.map(v => v.dateTime),
            y: heightValues.map(v => parseFloat(v.value)),
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'blue' },
            name: 'Gage Height (ft)',
            xaxis: 'x',
            yaxis: 'y3'
        });
    }
    else if (printMissing) {
        console.log(`No height for ${siteName}`);
    }

    if (hasTemp) {
        traces.push({
            x: tempValues.map(v => v.dateTime),
            y: tempValues.map(v => parseFloat(v.value) * (9 / 5) + 32),
            name: "Temperature (°F)",
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'green' },
            xaxis: "x2",
            yaxis: "y2",
        });

        // Explicit domains (not layout.grid): overlaid yaxis3 otherwise keeps
        // domain [0,1] and draws over the temperature panel.
        layout.yaxis.domain = [0.4, 1];
        if (layout.yaxis3 != undefined) {
            layout.yaxis3.domain = [0.4, 1];
        }
        layout.yaxis2 = {
            title: "Temperature (°F)",
            domain: [0, 0.32],
            automargin: true,
        };
        layout.xaxis = { anchor: 'y' };
        layout.xaxis2 = { matches: 'x', anchor: 'y2' };
    }
    else if (printMissing) {
        console.log(`No temperature for ${siteName}`);
    }

    // Wrap long site names and reserve room for both title and legend on mobile.
    if (window.matchMedia("(max-width: 600px)").matches) {
        const wrappedTitle = _wrapPlotTitle(siteName, 30);
        layout.title = {
            text: wrappedTitle,
            font: { size: 16 },
            y: 0.88,
            yanchor: "top",
        };
        const titleLines = wrappedTitle.split("<br>").length;
        layout.margin.t = (traces.length == 3 ? 130 : 100) + ((titleLines - 1) * 23);
    }

    // Create plot here (currently import work here is sloppy)
    // eslint-disable-next-line no-undef
    Plotly.newPlot(div, traces, layout, config);

    // Return whether we found any valid data
    return traces.length > 0;
}

function drawMaps(loc) {
    // Update map to gauge site
    const mapsURL = `https://maps.google.com/?api=1&q=${loc[0]},${loc[1]}&output=embed`
    mapDiv.innerHTML = `<hr><h1>Site Location</h1><iframe src="${mapsURL}" width="100%" height=500px allowfullscreen frameborder="0"></iframe>`

    // Update weather map
    weatherDiv.innerHTML = `<h1>Site Weather</h1><iframe id="weatherFrame" src="https://embed.windy.com/embed.html?type=map&location=coordinates&lat=${loc[0]}&lon=${loc[1]}&detailLat=${loc[0]}&detailLon=${loc[1]}&marker=true" frameborder="0" style="width:100%; height:500px;"></iframe>`;

}

export function updateView(data, verbose = false) {
    // Update the plot div and get valid/site location   
    if (!plotData(PLOT_DIV_NAME, data, verbose)) {
        // If not valid then we don't have a valid site location anyways
        return false;
    }
    // Show most recent readings above the plot
    updateCurrentConditions(data);
    // Draw the maps from the site location
    drawMaps(data[1]);
    return true;
}