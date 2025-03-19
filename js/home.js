"use strict";

import { states } from "./states.js";
import { getDataForSite, getSites } from "./data.js";

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
    // Get dict of sites for this state
    getSites(stateSelect.value).then(siteList => {
        sites = siteList;
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
        updateFavoritesView();
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
        updateFavoritesView();
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
    updateFavoritesView();
}

function favTabClick(evt) {
    var favorites = getFavorites();

    // Determine whether this is already a favorite (if so unfavorite)
    let dropFav = false;
    favorites.forEach(fav => {
        if(fav.id == siteSelect.value){
            // This is a match to an existing favorite, unfavorite
            removeFavorite(fav);
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

function getLatestValues(site){
    // Return a spot result
    return getDataForSite(site).then(data => {
        const[_siteName, _siteLoc, flowValues, heightValues, tempValues] = data;
        var [flow, height, temp] = [undefined, undefined, undefined];

        if(flowValues.length > 0) {
            flow = flowValues[flowValues.length-1].value;
        }
        if(heightValues.length > 0){
            height = heightValues[heightValues.length-1].value;
        }
        if(tempValues.length> 0) {
            temp = tempValues[tempValues.length-1].value * 9/5 + 32;
        }
        return [flow, height, temp];
    });
}

function _favStateClick(evt) {
    const stateName = evt.target.id.split("_")[0];
    const toggleButton = document.getElementById(`${stateName}_Toggle`)
    const waterDivs = document.getElementById(`${stateName}_div`).getElementsByClassName("waterDiv");

    for(let i = 0; i < waterDivs.length; i ++){
        let waterDiv = waterDivs[i];
        if(waterDiv.style.display == "block"){    
            waterDiv.style.display = "none";
            toggleButton.textContent = '▼'; // Down arrow for closed state
        }
        else{
            waterDiv.style.display = "block";
            toggleButton.textContent = '▲'; // Up arrow for open state
        }
    }
}

function _favWaterClick(evt) {
    const [stateName, waterName, _] = evt.target.id.split("_");
    const waterList = document.getElementById(`${stateName}_${waterName}_WaterList`);
    const toggleButton = document.getElementById(`${stateName}_${waterName}_Toggle`);

    if(waterList.style.display == "inline"){
        waterList.style.display = "none";
        toggleButton.textContent = '▼'; // Down arrow for closed state
    }
    else{
        waterList.style.display = "inline";
        toggleButton.textContent = '▲'; // Up arrow for open state
    }
}

// Remove an entire waterbody
function _favWaterRemove(evt) {
    const [state, water, _] = evt.target.id.split("_");
    const result = window.confirm(`Are you sure you want to remove all of ${water}, ${state}?`)
    if(!result){
        return;
    }    

    console.log(state, water);
    var toRemove = [];
    getFavorites().forEach(fav => {
        if(fav.state == state && fav.water == water){
            toRemove.push(fav);
        }
    });
    toRemove.forEach(fav => removeFavorite(fav));
    // Update the view
    updateFavoritesView();
}

function _createFavHeader(idName, text, type){
    var clickListener;
    var elementType;
    
    if(type == "state") {
        clickListener = _favStateClick;
        elementType = "h4";
    }
    else if(type == "water") {
        clickListener = _favWaterClick;
        elementType = "p";
    }
    else{
        throw Error(`Unknown header type: ${type}`);
    }

    var headerDiv = document.createElement("div");
    headerDiv.className = `${type}Header`;

    // Build the header
    var stateHeader = document.createElement(elementType);
    stateHeader.id = `${idName}_Header`;
    stateHeader.className = `${type}HeaderText`;
    stateHeader.textContent = text;
    stateHeader.style.display = "inline";
    stateHeader.style.cursor = "pointer";
    stateHeader.addEventListener("click", clickListener);
    
    // Add the toggle button
    var toggleButton = document.createElement('span');
    toggleButton.id = `${idName}_Toggle`;
    toggleButton.className = "toggleBtn";
    toggleButton.textContent = '▼'; // Down arrow for open state
    toggleButton.style.marginLeft = '5px';
    toggleButton.style.fontSize = '16px';

    // Add to the header
    stateHeader.appendChild(toggleButton);
    headerDiv.appendChild(stateHeader);

    // Make the close button
    if(type == "water"){
        var removeButton = document.createElement('span');
        removeButton.id = `${idName}_Remove`;
        removeButton.className = 'waterRemoveBtn';
        removeButton.textContent = 'x';
        removeButton.addEventListener("click", _favWaterRemove);
        headerDiv.appendChild(removeButton);
    }

    return headerDiv;
}


function updateFavoritesView() {
    // Get favorites from browser
    const favorites = getFavorites();
    
    // Clear existing
    favDiv.innerHTML = '';

    var waterDivs = {};
    favorites.forEach(fav => {
        // Deal with the state
        if(!(fav.state in waterDivs)){
            // Need to create a state (div)
            var stateDiv = document.createElement('div');
            stateDiv.id = `${fav.state}_div`;
            stateDiv.className = "stateDiv";
            
            // Create a header for this div
            let stateHeaderDiv = _createFavHeader(fav.state, fav.state, 'state');
            // stateHeader.addEventListener("click", _favStateClick);
            stateDiv.appendChild(stateHeaderDiv);

            // Add the state div to the favorites div
            favDiv.appendChild(stateDiv);

            // Update this to track it has been done
            waterDivs[fav.state] = {};
        }
        else{
            // Already have this state in favorites view
            stateDiv = document.getElementById(`${fav.state}_div`)
        }

        // Deal with the water body
        if(!(fav.water in waterDivs[fav.state])){
            // Need to create a water div here
            var waterDiv = document.createElement('div');
            waterDiv.className = "waterDiv";
            waterDiv.style.display = "none";

            let waterHeader = _createFavHeader(`${fav.state}_${fav.water}`, fav.water, 'water');
            waterDiv.appendChild(waterHeader);

            // Create a list of water for this state
            var waterList = document.createElement("ul");
            waterList.style.display = "none";
            waterList.id = `${fav.state}_${fav.water}_WaterList`;
            waterList.className = "waterList";           
            waterDiv.appendChild(waterList);

            // Add this div to the overall div
            stateDiv.appendChild(waterDiv);
            waterDivs[fav.state][fav.water] = waterDiv;
        }
        else{
            // Already have this water in favorites view
            waterList = document.getElementById(`${fav.state}_${fav.water}_WaterList`);
        }

        // Deal with each individual location inside of the water div
        var waterListItem = document.createElement("li");
        const url = gaugeUrl(fav.state, fav.id, 30);
        waterListItem.innerHTML = `<a href=${url} target=_blank>${fav.loc}</a>`
        waterList.appendChild(waterListItem);

        // Update the stats for this item
        getLatestValues(fav.id).then(
            values => {
                const [flow, height, temp] = values;
                waterListItem.innerHTML += `<br>`
                if(flow != undefined){
                    waterListItem.innerHTML += `${flow} cfs  `;
                }
                if(height != undefined){
                    waterListItem.innerHTML += `${height} ft   `;
                }
                if(temp != undefined){
                    waterListItem.innerHTML += `${temp} °F`
                }
            }
        );
    });
    

    // Set a custom message here
    if(favorites.length == 0){
        favDiv.innerHTML = '<p style="color: gray">No Favorites</p>';
    }

    return favorites;
}

// Load the favorites here
let favorites = updateFavoritesView();

// Add these event listeners
stateSelect.addEventListener("change", updateWaterSelect);
waterSelect.addEventListener("change", updateSiteSelect);
siteSelect.addEventListener("change", updateSiteFav);
exploreForm.addEventListener("submit", gotoGauge)
favBtn.addEventListener("click", favTabClick);

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