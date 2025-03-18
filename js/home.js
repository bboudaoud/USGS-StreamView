"use strict";

import { states } from "./states.js";
import { getSites } from "./parse.js";

const tabLinks = document.getElementsByClassName("tablinks");

// Explore form
const exploreForm = document.getElementById("exploreForm");
const stateSelect = document.getElementById("state");
const waterSelect = document.getElementById("waterBody");
const siteSelect = document.getElementById("location");
const periodEntry = document.getElementById("periodDays");

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
    // updateTimeSeries();
}

function gotoGauge(event) {
    const state = stateSelect.value;
    const siteId = siteSelect.value;
    const period = periodEntry.value;

    // Open in a new tab (for now)
    const url = `gaugeSite.html?state=${state}&site_id=${siteId}&periodDays=${period}`;
    console.log(url);
    window.open(url, "_blank")

    // Ignore default
    event.preventDefault()
}

export function openTab(evt) {
    // Get all elements with class="tabcontent" and hide them
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    const id = evt.target.innerHTML;
    console.log(id);
    document.getElementById(id).style.display = "block";
    evt.currentTarget.className += " active";
}

// Add these event listeners
stateSelect.addEventListener("change", updateWaterSelect);
waterSelect.addEventListener("change", updateSiteSelect);

exploreForm.addEventListener("submit", gotoGauge)

// Bind these to tab click
for(let i = 0; i < tabLinks.length; i++){
    tabLinks[i].onclick = openTab;
}
// Open the first tab by default
if (tabLinks.length > 0) {
    tabLinks[0].click();
}