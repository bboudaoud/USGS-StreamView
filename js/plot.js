"use strict";


// Divs
const PLOT_DIV_NAME = 'plotDiv';
// const plotDiv = document.getElementById(PLOT_DIV_NAME);
const mapDiv = document.getElementById('mapDiv');
const weatherDiv = document.getElementById('weatherDiv');



function plotData(div, data, printMissing = false){
    // Transform the data
    const [siteName, _, flowValues, heightValues, tempValues] = data;

    // Storage for this method
    var traces = [];
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
    var config = {
        responsive: true,
    };

    // Create Plotly figure for flow and height
    if(flowValues.length > 0) {
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

    if(tempValues.length > 0){
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
        
        // Modify the layout here for a 2nd plot
        layout.grid = {rows: 2, columns: 1};
        layout.xaxis2 = { matches: 'x' };
        layout.yaxis2 = { title: "Temperature (°F)" };
    }
    else if(printMissing){
        console.log(`No temperature for ${siteName}`);
    }

    // Create plot here (currently import work here is sloppy)
    // eslint-disable-next-line no-undef
    Plotly.newPlot(div, traces, layout, config);
    
    // Return whether we found any valid data
    return traces.length > 0;
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
    if(!plotData(PLOT_DIV_NAME, data, verbose)){
        // If not valid then we don't have a valid site location anyways
        return false;
    }
    // Draw the maps from the site location
    drawMaps(data[1]);
    return true;
}