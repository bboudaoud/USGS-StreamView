"use strict";

import { states } from "./states.js";
import { getSites } from "./parse.js";

const tabLinks = document.getElementsByClassName("tablinks");
const favDiv = document.getElementById("Favorites");

// Explore form
const exploreForm = document.getElementById("exploreForm");
const stateSelect = document.getElementById("state");
const waterSelect = document.getElementById("waterBody");
const siteSelect = document.getElementById("location");
const periodEntry = document.getElementById("periodDays");
const favBtn = document.getElementById("favBtn");

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
}

function openTab(evt) {
    // Get all elements with class="tabcontent" and hide them
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    }

    // This gets the ID for the corresponding tabcontent class
    const id = evt.target.innerHTML;

    if(id == "Favorites"){
        showFavorites();
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(id).style.display = "block";
    evt.currentTarget.className += " active";
}

function gaugeUrl(state, siteId, period){
    return `gaugeSite.html?state=${state}&site_id=${siteId}&periodDays=${period}`;
}
function gotoGauge(event) {
    const state = stateSelect.value;
    const siteId = siteSelect.value;
    const period = periodEntry.value;

    // Open in a new tab (for now)
    window.open(gaugeUrl(state, siteId, period), "_blank")

    // Ignore default
    event.preventDefault()
}

function getFavorites() {
    const j = localStorage.getItem('favorites');
    if(j == undefined){
        return [];
    }
    return JSON.parse(j);
}

function saveFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function showFavorites() {
    // Get favorites from browser
    const favorites = getFavorites();
    
    // Clear existing
    favDiv.innerHTML = '';

    var stateDivs = {};
    favorites.forEach(fav => {
        if(!(fav.state in stateDivs)){
            // Need to create a state (div)
            var stateDiv = document.createElement('div');
            stateDiv.className = "stateDiv";
            
            // Build the header
            var stateHeader = document.createElement('h4');
            stateHeader.id = `${fav.state}_Header`;
            stateHeader.className = "stateHeader";
            stateHeader.textContent = fav.state;
            stateHeader.style.cursor = "pointer";
            
            // Add the toggle button
            var toggleButton = document.createElement('span');
            toggleButton.textContent = '▼'; // Down arrow for open state
            toggleButton.style.marginLeft = '5px';
            toggleButton.style.fontSize = '16px';
            // Add to the header
            stateHeader.appendChild(toggleButton);

            // Add click handler
            stateHeader.addEventListener("click", function(evt) {
                const stateName = evt.target.id.split("_")[0];
                const stateList = document.getElementById(`${stateName}_StateList`);
                const displayState = stateList.style.display;

                if(displayState == "inline"){
                    stateList.style.display = "none";
                    toggleButton.textContent = '▼'; // Down arrow for closed state
                }
                else{
                    stateList.style.display = "inline";
                    toggleButton.textContent = '▲'; // Up arrow for open state
                }
            })

            // Create a state list
            var stateList = document.createElement("ul");
            stateList.style.display = "none";
            stateList.id = `${fav.state}_StateList`
            stateList.className = "stateList";

            // Add children
            stateDiv.appendChild(stateHeader);
            stateDiv.appendChild(stateList);
            favDiv.appendChild(stateDiv);
            stateDivs[fav.state] = stateDiv;
        }
        else{
            stateList = document.getElementById(`${fav.state}_StateList`);
        }

        // Now each favorite should be unique
        var waterListItem = document.createElement("li");
        const url = gaugeUrl(fav.state, fav.id, 30);
        waterListItem.innerHTML = `<a href=${url} target=_blank>${fav.water} ${fav.loc}</a>`
        stateList.appendChild(waterListItem);

    });

    if(Object.keys(stateDivs).length == 0){
        favDiv.innerHTML = '<p style="color: gray">No Favorites</p>';
    }
}

function addFavorite() {
    // Get existing favorites
    var favorites = getFavorites();
    
    // Create a new favorite
    const newFav = {
        state: stateSelect.value,
        water: waterSelect.value,
        loc: siteSelect.options[siteSelect.selectedIndex].text,
        id: siteSelect.value,
    };

    if(newFav.state == "" || newFav.water == "" || newFav.loc == ""){
        return;
    }

    // Add if not present
    if (!favorites.includes(newFav)){
        // Add here
        favorites.push(newFav);
        saveFavorites(favorites);
        console.log("add favorite: ", newFav);
    }
    // Load new favorites
    showFavorites();
}

// Load the favorites here
showFavorites();

// Add these event listeners
stateSelect.addEventListener("change", updateWaterSelect);
waterSelect.addEventListener("change", updateSiteSelect);
exploreForm.addEventListener("submit", gotoGauge)
favBtn.onclick = function(evt) { addFavorite(); evt.preventDefault(); };

// Bind these to tab click
for(let i = 0; i < tabLinks.length; i++){
    tabLinks[i].onclick = openTab;
}
// Open the first tab by default
if (tabLinks.length > 0) {
    tabLinks[0].click();
}