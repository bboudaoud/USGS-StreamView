// Divs
const plotDiv = document.getElementById('plotDiv');
const mapDiv = document.getElementById('mapDiv');
const weatherDiv = document.getElementById("weatherDiv");

function plot_data(div, flowData, heightData, tempData, printMissing = false){
    // Transform the data
    const flowValues = _get_time_series(flowData).map(v => v.value);
    const heightValues = _get_time_series(heightData).map(v => v.value);
    const tempValues = _get_time_series(tempData).map(v => v.value);
    const tempValuesFahrenheit = tempValues.map(c => c * (9/5) + 32);

    var traces = [];
    var siteName = undefined;
    var siteLoc = [undefined, undefined];

    // Create Plotly figure for flow and height
    if(flowValues.length > 0) {
        const times = _get_time_series(flowData).map(v => v.dateTime);
        const flowInfo = flowData.value.timeSeries[0].sourceInfo;
        siteName = flowInfo.siteName;
        siteLoc = [flowInfo.geoLocation.geogLocation.latitude, flowInfo.geoLocation.geogLocation.longitude];
        const flowTrace = {
            x: times,
            y: flowValues,
            name: 'Streamflow (cfs)',
            type: 'scatter',
            mode: 'lines',
            xaxis: 'x',
            yaxis: 'y',
            marker: { color: 'red' },
        }
        traces.push(flowTrace);
    }
    else if(printMissing){
        console.log(`No flow for ${location}`);
    }

    if (heightValues.length > 0){
        const times = _get_time_series(heightData).map(v => v.dateTime);
        const heightInfo = heightData.value.timeSeries[0].sourceInfo;
        siteName = heightInfo.siteName;
        siteLoc = [heightInfo.geoLocation.geogLocation.latitude, heightInfo.geoLocation.geogLocation.longitude];
        const heightTrace = {
            x: times,
            y: heightValues,
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'blue' },
            name: 'Gage Height (ft)',
            xaxis: 'x',
            yaxis: 'y3'
        };
        traces.push(heightTrace);
    }
    else if(printMissing){
        console.log(`No height for ${location}`);
    }

    var hasTemp = false;
    if(tempValuesFahrenheit.length > 0){
        const times = _get_time_series(tempData).map(v => v.dateTime);
        const tempInfo = tempData.value.timeSeries[0].sourceInfo;
        siteName = tempInfo.siteName;
        siteLoc = [tempInfo.geoLocation.geogLocation.latitude, tempInfo.geoLocation.geogLocation.longitude];
        hasTemp = true;
        const tempTrace = {
            x: times,
            y: tempValuesFahrenheit,
            name: "Temperature (°F)",
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'green' },
            xaxis: "x2",
            yaxis: "y2",
        }
        traces.push(tempTrace);
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

    // Create plot here
    Plotly.newPlot(div, traces, layout, config);

    // Return whether we found any valid data
    return [(traces.length > 0), siteLoc];
}

function update_view(flow, height, temp, verbose = false){
    // Update the plot div and get valid/site location
    const [valid, siteLoc] = plot_data('plotDiv', flow, height, temp, verbose);
    
    if(!valid){
        // If not valid then we don't have a valid site location anyways
        return false;
    }

    // Update map to gauge site
    const mapsURL = `https://maps.google.com/?api=1&q=${siteLoc[0]},${siteLoc[1]}&output=embed`
    mapDiv.innerHTML = `<hr><h1>Site Location</h1><iframe src="${mapsURL}" width="100%" height=500px allowfullscreen frameborder="0"></iframe>`

    // Update weather
    weatherDiv.innerHTML = `<h1>Site Weather</h1><iframe id="weatherFrame" src="https://embed.windy.com/embed.html?type=map&location=coordinates&lat=${siteLoc[0]}&lon=${siteLoc[1]}&detailLat=${siteLoc[0]}&detailLon=${siteLoc[1]}&marker=true" frameborder="0" style="width:100%; height:500px;"></iframe>`;
    
    return valid;
}