"use strict";


// Divs
const PLOT_DIV_NAME = 'plotDiv';
// const plotDiv = document.getElementById(PLOT_DIV_NAME);
const mapDiv = document.getElementById('mapDiv');
const weatherDiv = document.getElementById('weatherDiv');

// Utility method for reading a time series below
function _get_time_series(data, varName) {
    const timeSeries = data.value.timeSeries;
    for(let i =0; i < timeSeries.length; i++){
        const ts = timeSeries[i];
        if(ts.variable.variableName.includes(varName)){
            // Found a match
            return ts.values[0].value;
        }
    }
    return [];
}

function _get_source_info(data, varName){
    for(let i = 0; i < data.value.timeSeries.length; i++){
        const ts = data.value.timeSeries[i];
        if(ts.variable.variableName.includes(varName)){
            // Found a match
            return ts.sourceInfo;
        }
    }
    return {}; 
}

function plotData(div, data, printMissing = false){
    // Transform the data
    const flowValues = _get_time_series(data, "Streamflow");
    const flowInfo = _get_source_info(data, "Streamflow");

    const heightValues = _get_time_series(data, "Gage height");
    const heightInfo = _get_source_info(data, "Gage height");

    const tempValues = _get_time_series(data, "Temperature, water");
    const tempInfo = _get_source_info(data, "Temperature, water");

    // Storage for this method
    var traces = [];
    var siteName = undefined;
    var siteLoc = [undefined, undefined];

    // Create Plotly figure for flow and height
    if(flowValues.length > 0) {
        siteName = flowInfo.siteName;
        siteLoc = [flowInfo.geoLocation.geogLocation.latitude, flowInfo.geoLocation.geogLocation.longitude];
        traces.push({
            x: flowValues.map(v => v.dateTime),
            y: flowValues.map(v => v.value),
            name: 'Streamflow (cfs)',
            type: 'scatter',
            mode: 'lines',
            xaxis: 'x',
            yaxis: 'y',
            marker: { color: 'red' },
        });
    }
    else if(printMissing){
        console.log(`No flow for ${location}`);
    }

    if (heightValues.length > 0){
        siteName = heightInfo.siteName;
        siteLoc = [heightInfo.geoLocation.geogLocation.latitude, heightInfo.geoLocation.geogLocation.longitude];
        traces.push({
            x: heightValues.map(v => v.dateTime),
            y: heightValues.map(v => v.value),
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'blue' },
            name: 'Gage Height (ft)',
            xaxis: 'x',
            yaxis: 'y3'
        });
    }
    else if(printMissing){
        console.log(`No height for ${location}`);
    }

    var hasTemp = false;
    if(tempValues.length > 0){
        siteName = tempInfo.siteName;
        siteLoc = [tempInfo.geoLocation.geogLocation.latitude, tempInfo.geoLocation.geogLocation.longitude];
        hasTemp = true;
       traces.push({
            x: tempValues.map(v => v.dateTime),
            y: tempValues.map(v => v.value * (9/5) + 32),
            name: "Temperature (°F)",
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'green' },
            xaxis: "x2",
            yaxis: "y2",
        });
    }
    else if(printMissing){
        console.log(`No temperature for ${siteName}`);
    }

    // Base figure layout
    var layout = {
        title: siteName,
        yaxis: { title: 'Streamflow (cfs)' },
        yaxis3: {
            title: 'Gage Height (ft)',
            overlaying: 'y',
            side: 'right'
        },
        legend: {
            orientation:'h',
            x: 0.5,
            y: 1,
            xanchor: 'center',
            yanchor: 'bottom',
        }
    }

    // Add these fields when we have temperature over time
    if (hasTemp){
        layout.grid = {rows: 2, columns: 1};
        layout.xaxis2 = { matches: 'x' };
        layout.yaxis2 = { title: "Temperature (°F)" };
    }

    var config = {
        responsive: true,
    };

    // Create plot here (currently import work here is sloppy)
    // eslint-disable-next-line no-undef
    Plotly.newPlot(div, traces, layout, config);
    
    // Return whether we found any valid data
    return [(traces.length > 0), siteLoc];
}

function drawMaps(loc){
    // Update map to gauge site
    const mapsURL = `https://maps.google.com/?api=1&q=${loc[0]},${loc[1]}&output=embed`
    mapDiv.innerHTML = `<hr><h1>Site Location</h1><iframe src="${mapsURL}" width="100%" height=500px allowfullscreen frameborder="0"></iframe>`

    // Update weather map
    weatherDiv.innerHTML = `<h1>Site Weather</h1><iframe id="weatherFrame" src="https://embed.windy.com/embed.html?type=map&location=coordinates&lat=${loc[0]}&lon=${loc[1]}&detailLat=${loc[0]}&detailLon=${loc[1]}&marker=true" frameborder="0" style="width:100%; height:500px;"></iframe>`;
    
}

export function updateView(data, verbose = false){
    // Update the plot div and get valid/site location
    const [valid, siteLoc] = plotData(PLOT_DIV_NAME, data, verbose);
    
    if(!valid){
        // If not valid then we don't have a valid site location anyways
        return false;
    }

    drawMaps(siteLoc);

    return valid;
}