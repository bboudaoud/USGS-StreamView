"use strict";

import { states } from "./states.js";
import { getSites } from "./parse.js";

const tabs = document.getElementsByClassName("tablinks");
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
    // Update the favorite btn based on status
    updateSiteFav();
}

// eslint-disable-next-line no-unused-vars
function updateSiteFav(_evt=undefined) {
    const siteId = siteSelect.value;
    let foundFav = false;
    // Check for this site in favorites
    getFavorites().forEach(fav => {
        if(siteId == fav.id){
            favBtn.style.backgroundColor = "gold";
            foundFav = true;
        }
    });
    if(!foundFav){
        console.log("hey");
        favBtn.style.backgroundColor = "#AAA";
    }
}

function openTab(evt) {
    // Get all elements with class="tabcontent" and hide them
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
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
    if(favorites != undefined) {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }
}

function addFavorite() {
    // Get existing favorites
    var favorites = getFavorites();
    
    if(stateSelect.value == undefined || waterSelect.value == undefined || siteSelect.value == undefined || siteSelect.selectedIndex == -1){
        return false;
    }

    // Create a new favorite
    const newFav = {
        state: stateSelect.value,
        water: waterSelect.value,
        loc: siteSelect.options[siteSelect.selectedIndex].text,
        id: siteSelect.value,
    };

    if(newFav.state == "" || newFav.water == "" || newFav.loc == ""){
        return false;
    }

    // Add if not present
    if (!favorites.includes(newFav)){
        // Add here
        favorites.push(newFav);
        saveFavorites(favorites);
        console.log("ADD FAVORITE: ", newFav);
        // Load new favorites
        showFavorites();
    }
    // This indicates that this is now/aready was a favorite
    return true;
}

function removeFavorite(fav){
    var favorites = getFavorites();

    let favIdx = -1;
    for(let i = 0; i < favorites.length; i++){
        if(favorites[i].id == fav.id){
            favIdx = i;
        }
    }

    // Early exit for not present
    if(favIdx < 0){
        // Did not find this favorite
        return;
    }
    // Splice around index/remove from this list
    favorites.splice(favIdx, 1);
    console.log("REMOVE FAVORITE: ", fav);
    // Update the memory
    saveFavorites(favorites);
}

function favClick(evt) {
    var favorites = getFavorites();

    // Determine whether this is already a favorite (if so unfavorite)
    let dropFav = false;
    favorites.forEach(fav => {
        if(fav.id == siteSelect.value){
            // This is a match to an existing favorite, unfavorite
            removeFavorite(fav);
            console.log()
            dropFav = true;
        }
    })
    if(!dropFav){
        addFavorite();
    }

    // Add a favorite (if we don't already have one)
    favBtn.style.backgroundColor = "#AAA";
    if(!dropFav){
        // Set the color of the button
        favBtn.style.backgroundColor = "gold";
    }

    // Prevent this event from submitting the form
    evt.preventDefault(); 
    evt.stopPropagation();
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
            toggleButton.id = `${fav.state}_Toggle`;
            toggleButton.className = "toggleState";
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

    return favorites;
}

// Load the favorites here
let favorites = showFavorites();

// Add these event listeners
stateSelect.addEventListener("change", updateWaterSelect);
waterSelect.addEventListener("change", updateSiteSelect);
siteSelect.addEventListener("change", updateSiteFav);
exploreForm.addEventListener("submit", gotoGauge)
favBtn.addEventListener("click", favClick);

// Bind these to tab click
for(let i = 0; i < tabs.length; i++){
    tabs[i].onclick = openTab;
}

// Check for no favorites, if no favorites to explore view
if(favorites.length == 0){
    // This selects the "explore" tab
    tabs[1].click();
}
else{
    // This selects the "favorites" tab
    tabs[0].click();
}