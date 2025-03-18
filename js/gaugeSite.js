"use strict";

import { updateView } from './plot.js';
import { getSites } from './parse.js';
import { states } from './states.js';

// Form elements
const usgsForm = document.getElementById('usgsForm');
const stateSelect = document.getElementById('state');
const waterSelect = document.getElementById('waterbody');
const siteSelect = document.getElementById('site_id');
const periodDaysEntry = document.getElementById('periodDays');
const submitBtn = document.getElementById("fetchDataBtn");

// Add states to drop down
states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.text = state;
    stateSelect.appendChild(option);
});

// Storage for the selected state's sites (grouped by waterbody)
var sites = {};

// Callback from state select, updates the waterbody select options
// eslint-disable-next-line no-unused-vars
function updateWaterSelect(_evt=undefined, siteId=undefined) {
    waterSelect.innerHTML = '';
    const state = stateSelect.value;
    const siteUrl = `https://waterservices.usgs.gov/nwis/iv/?stateCd=${state}&format=json`;
    fetch(siteUrl)
        .then(response=>response.json())
        .then(
            data => {
                // Get dict of sites for this state
                sites = getSites(data.value.timeSeries);
                // Populate the water drop down
                Object.keys(sites).forEach(key => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.text = key;
                    waterSelect.appendChild(option);
                    for(let loc in sites[key]){
                        if(sites[key][loc] == siteId){
                            waterSelect.value = key;
                        }
                    }
                });
                // Update the site selectron from the water
                updateSiteSelect(undefined, siteId);
            })
        .catch(error => console.error('Error fetching locations:', error));
}

// Callback from the waterbody select, updates the site select options
// eslint-disable-next-line no-unused-vars
function updateSiteSelect(_evt=undefined, siteId=undefined) {
    if(sites == undefined){
        console.warn("Site select update without sites defined!");
        return;
    }
    const water = waterSelect.value;
    siteSelect.innerHTML = '';
    // Get options for location
    Object.keys(sites[water]).forEach(key => {
        const option = document.createElement('option');
        option.value = sites[water][key];
        option.text = key;
        siteSelect.appendChild(option);
    });
    if(siteId != undefined && siteId != ""){
        siteSelect.value = siteId;
    }
    else{
        siteSelect.selectedIndex = 0;
    }
    updateTimeSeries();
}

// Core method for updating the current time series
function updateTimeSeries() {
    // Update the site code
    const siteCode = siteSelect.value;
    // Check if site code is valid
    if (siteCode == undefined || siteCode == ""){
        // Can't update
        // console.warn("Cannot update, empty site code!");
        return false;
    }

    // Update other values
    if(siteSelect.options.length == 0) {
        return false;
    }
    // Get the site label (english name)
    const siteLabel = siteSelect.options[siteSelect.selectedIndex].text;

    // Get the period
    const periodDays = periodDaysEntry.value;
    const period = `P${periodDays}D`;

    // Fetch data from USGS API
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteCode}&period=${period}&parameterCd=00060,00065,00010`;
    fetch(url).then(response => {
        if(!response.ok){
            throw new Error(`Response status error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        try {                
            // This creates the plot in the right div
            if(!updateView(data)){
                // This item has neither flow, height, or temperature, remove it and update
                console.warn(`No data found for the gauge ${siteLabel}... removing from list.`);
                for(let i = 0; i < siteSelect.options.length; i++){
                    if (siteSelect.options[i].value == siteSelect.value){
                        // Drop this element
                        siteSelect.remove(i);
                        break;
                    }
                }
                if(siteSelect.options.length == 0){
                    // There are no options left for this waterbody, remove it entirely
                    console.warn(`Entire ${waterSelect.value} waterbody is now empty, removing`)
                    for(let i = 0; i < waterSelect.options.length; i++){
                        if (waterSelect.options[i].value == waterSelect.value){
                            waterSelect.remove(i);
                            break;
                        }
                    }
                    // Just select the first again here (for now)
                    waterSelect.selectedIndex = 0;
                    // Update the sites for the first selected index
                    updateSiteSelect();
                }
                
                // Schedule another call to us (will need to update)
                setTimeout(updateTimeSeries, 10);
            }
        } 
        catch (error) {
            console.error('Error parsing JSON:', error);
        }
    })
    .catch(error => console.error('Error fetching data:', error));
    return true;
}

// Layout tweak for mobile
const is_mobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
if(is_mobile){
    // Split out elements
    const splits = document.getElementsByClassName("split_div");
    for(let i = 0; i < splits.length; i++){
        splits[i].style = {display: "block"};
    }
    // Change alignment of these
    periodDaysEntry.style = {display: "block"};
    submitBtn.style = {display: "block"};
}

// Get behavior from URL params
let params = new URLSearchParams(document.location.search);

// Get the state (2 character e.g, VA)
let state = params.get("state");
if (state != undefined){
    stateSelect.value = state;
}
else{
    // Set this by default
    stateSelect.value = "VA";
}

// Get the days to plot (back from now, up to 120)
let pDays = params.get("periodDays");
if (pDays != undefined){
    periodDaysEntry.value = Math.max(1, Math.min(pDays, 120));
}

// Get the site ID (numeric code)
let siteId = params.get("site_id");
if (siteId != undefined){
    // A site id is provided, this will be looked up below
    siteSelect.value = siteId;
}

// Load initial location here
updateWaterSelect(undefined, siteId);

// Set up event listeners
stateSelect.addEventListener('change', updateWaterSelect);
waterSelect.addEventListener('change', updateSiteSelect);
siteSelect.addEventListener('change', updateTimeSeries);
usgsForm.addEventListener('submit', updateTimeSeries);
