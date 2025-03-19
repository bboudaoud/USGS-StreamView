"use strict";

import { addStatesToSelect } from "./states.js";
import { getDataForSite, getSites } from "./data.js";
import { addFavorite, removeFavorite, getFavorites, isFavorite, updateFavorite, getFavoriteById } from "./favorites.js";

const tabs = document.getElementsByClassName("tablinks");
const favTab = document.getElementById("Favorites");

// Explore form
const exploreForm = document.getElementById("exploreForm");
const stateSelect = document.getElementById("state");
const waterSelect = document.getElementById("waterBody");
const siteSelect = document.getElementById("location");
const periodEntry = document.getElementById("periodDays");
const favWaterBtn = document.getElementById("favWaterbody")
const favSiteBtn = document.getElementById("favSite");
const favDiv = document.getElementById("favDiv");

// Favorites
const modeChangeOptions = document.getElementsByClassName("modeRb");
const levelUnitLabels = document.getElementsByClassName("levelUnits");
const tempUnitLabels = document.getElementsByClassName("tempUnits");
const updateFavThreshBtn = document.getElementById("updateFavThreshBtn");

// Add states to drop down
addStatesToSelect(stateSelect);

// Storage for the selected state's sites (grouped by waterbody)
var sites = {};

// Callback from state select, updates the waterbody select options
// eslint-disable-next-line no-unused-vars
function updateWaterSelect(_evt = undefined, siteId = undefined) {
    waterSelect.innerHTML = '';
    siteSelect.innerHTML = '';
    // Get dict of sites for this state
    getSites(stateSelect.value).then(siteList => {
        sites = siteList;
        // Populate the water drop down
        Object.keys(sites).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = key;
            waterSelect.appendChild(option);
            for (let loc in sites[key]) {
                if (sites[key][loc] == siteId) {
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
function updateSiteSelect(_evt = undefined, siteId = undefined) {
    if (sites == undefined) {
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
    if (siteId != undefined && siteId != "") {
        siteSelect.value = siteId;
    }
    else {
        siteSelect.selectedIndex = 0;
    }
    // Update water and site favorites
    updateFavoriteBtnStatus();
}

// eslint-disable-next-line no-unused-vars
function updateFavoriteBtnStatus(_evt) {
    // Update the water favorite button
    let fav_sites = [];
    getFavorites().forEach(fav => {
        // Need to check and see if all sites for this water are in the favorites
        if (fav.water == waterSelect.value) {
            fav_sites.push(fav.id);
        }
    });
    if (fav_sites.length > 0 && fav_sites.length == siteSelect.options.length) {
        // All sites for this water are in the favorites
        favWaterBtn.style.backgroundColor = "gold";
    }
    else {
        favWaterBtn.style.backgroundColor = "#AAA";
    }

    // Update the site favorite button
    const isFav = isFavorite(siteSelect.value);
    if (!isFav) {
        favSiteBtn.style.backgroundColor = "#AAA";
        favDiv.style.display = "none";
    }
    else {
        favSiteBtn.style.backgroundColor = "gold";
        favDiv.style.display = "block";
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

    if (id == "Favorites") {
        updateFavoritesView();
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(id).style.display = "block";
    evt.currentTarget.className += " active";
}

function gaugeUrl(state, siteId, period) {
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

function _favBtnClick(evt) {
    var mode;
    if (evt.target.id == "favSite") {
        mode = "site";
    }
    else if (evt.target.id == "favWaterbody") {
        mode = "water";
    }
    else {
        throw new Error(`Cannot handle callback from ${event.target.id}`)
    }

    // This handles clicking the "add new favorite" (start) button in explore
    const favorites = getFavorites();

    // Determine whether this is already a favorite (if so unfavorite)
    let dropFav = false;
    if (mode == "site") {
        favorites.forEach(fav => {
            if (fav.id == siteSelect.value) {
                // This is a match to an existing favorite, unfavorite
                removeFavorite(fav);
                dropFav = true;
                return;
            }
        })
        if (!dropFav && siteSelect.selectedIndex >= 0) {
            // Create a new favorite
            const newFav = {
                state: stateSelect.value,
                water: waterSelect.value,
                loc: siteSelect.options[siteSelect.selectedIndex].text,
                id: siteSelect.value,
            };
            addFavorite(newFav);
        }
    }
    else if (mode == "water") {
        // Add all of these for now
        for (let i = 0; i < siteSelect.options.length; i++) {
            const newFav = {
                state: stateSelect.value,
                water: waterSelect.value,
                loc: siteSelect.options[i].text,
                id: siteSelect.options[i].value,
            };
            addFavorite(newFav);
        }
    }

    // Update the drawn status
    updateFavoriteBtnStatus();

    // Prevent this event from submitting the form
    evt.preventDefault();
    evt.stopPropagation();
}

function getLatestValues(site) {
    // Return a spot result
    return getDataForSite(site).then(data => {
        // eslint-disable-next-line no-unused-vars
        const [_siteName, _siteLoc, flowValues, heightValues, tempValues] = data;
        var [flow, height, temp] = [undefined, undefined, undefined];

        if (flowValues.length > 0) {
            flow = flowValues[flowValues.length - 1].value;
            flow = Math.round(flow * 10) / 10;
        }
        if (heightValues.length > 0) {
            height = heightValues[heightValues.length - 1].value;
            height = Math.round(height * 100) / 100;
        }
        if (tempValues.length > 0) {
            temp = tempValues[tempValues.length - 1].value * 9 / 5 + 32;
            temp = Math.round(temp * 100) / 100;
        }
        return [flow, height, temp];
    });
}

function _favStateClick(evt) {
    const stateName = evt.target.id.split("_")[0];
    const toggleButton = document.getElementById(`${stateName}_Toggle`)
    const waterDivs = document.getElementById(`${stateName}_div`).getElementsByClassName("waterDiv");

    for (let i = 0; i < waterDivs.length; i++) {
        let waterDiv = waterDivs[i];
        if (waterDiv.style.display == "block") {
            waterDiv.style.display = "none";
            toggleButton.textContent = '▼'; // Down arrow for closed state
        }
        else {
            waterDiv.style.display = "block";
            toggleButton.textContent = '▲'; // Up arrow for open state
        }
    }
}

function _favWaterClick(evt) {
    // eslint-disable-next-line no-unused-vars
    const [stateName, waterName, _] = evt.target.id.split("_");
    const toggleButton = document.getElementById(`${stateName}_${waterName}_Toggle`);
    const siteDivs = document.getElementById(`${stateName}_${waterName}_div`).getElementsByClassName("siteDiv");

    for (let i = 0; i < siteDivs.length; i++) {
        let siteDiv = siteDivs[i];
        if (siteDiv.style.display == "block") {
            siteDiv.style.display = "none";
            toggleButton.textContent = '▼'; // Down arrow for closed state
        }
        else {
            siteDiv.style.display = "block";
            toggleButton.textContent = '▲'; // Up arrow for open state
        }
    }
}

// Remove an entire waterbody
function _favWaterRemove(evt) {
    // eslint-disable-next-line no-unused-vars
    const [state, water, _] = evt.target.id.split("_");
    if (!window.confirm(`Are you sure you want to remove all of ${water}, ${state}?`)) {
        return;
    }
    // Remove all water that matches this waterbody
    var toRemove = [];
    getFavorites().forEach(fav => {
        if (fav.state == state && fav.water == water) {
            toRemove.push(fav);
        }
    });
    toRemove.forEach(fav => removeFavorite(fav));
    // Update the view
    updateFavoritesView();
}

function _favSiteRemove(evt) {
    const siteId = evt.target.id.split("_")[0];
    getFavorites().forEach(fav => {
        if (fav.id == siteId) {
            removeFavorite(fav);
            updateFavoritesView();
            return;
        }
    })
}

function createRemoveButton(idName, classType) {
    var removeCallback;
    if (classType == "water") {
        removeCallback = _favWaterRemove;
    }
    else if (classType == "site") {
        removeCallback = _favSiteRemove;
    }
    else {
        throw Error(`Uknown remove button type: ${classType}`);
    }
    // Create the button and return it
    var removeButton = document.createElement('span');
    removeButton.id = `${idName}_Remove`;
    removeButton.className = `${classType}RemoveBtn`;
    removeButton.textContent = 'x';
    removeButton.addEventListener("click", removeCallback);
    return removeButton;
}

function createFavHeader(idName, text, type) {
    var clickListener;
    var elementType;

    if (type == "state") {
        clickListener = _favStateClick;
        elementType = "h4";
    }
    else if (type == "water") {
        clickListener = _favWaterClick;
        elementType = "p";
    }
    else {
        throw Error(`Unknown header type: ${type}`);
    }

    let headerDiv = document.createElement("div");
    headerDiv.className = `${type}Header`;

    // Build the header
    let stateHeader = document.createElement(elementType);
    stateHeader.id = `${idName}_Header`;
    stateHeader.className = `${type}HeaderText`;
    stateHeader.textContent = text;
    stateHeader.addEventListener("click", clickListener);

    // Add the toggle button
    let toggleButton = document.createElement('span');
    toggleButton.id = `${idName}_Toggle`;
    toggleButton.className = "toggleBtn";
    toggleButton.textContent = '▼';

    // Add to the header
    stateHeader.appendChild(toggleButton);
    headerDiv.appendChild(stateHeader);

    // Make the close button
    if (type == "water") {
        headerDiv.appendChild(createRemoveButton(idName, "water"));
    }

    return headerDiv;
}

function createFavSite(fav) {
    let siteDiv = document.createElement('div');
    siteDiv.id = `${fav.id}_fav_div`;
    siteDiv.className = 'siteDiv';

    // Add name label
    let siteNameLabel = document.createElement("p");
    siteNameLabel.className = "siteNameText";
    siteNameLabel.innerHTML = `<a href=${gaugeUrl(fav.state, fav.id, 30)} target=_blank>${fav.loc}</a>`;
    siteDiv.appendChild(siteNameLabel);

    // Add stats
    let siteStats = document.createElement("p");
    siteStats.className = "siteStatsText";
    siteDiv.appendChild(siteStats);

    // Update the stats for this item
    getLatestValues(fav.id).then(
        values => {
            const [flow, height, temp] = values;
            if (flow != undefined) {
                siteStats.innerHTML += `${flow} cfs  `;
            }
            if (height != undefined) {
                siteStats.innerHTML += `${height} ft   `;
            }
            if (temp != undefined) {
                siteStats.innerHTML += `${temp} °F`
            }
        }
    );

    // Add remove button
    siteDiv.appendChild(createRemoveButton(fav.id, 'site'));

    return siteDiv;
}

function updateEntryUnitLabels(evt){
    const rb_type = evt.target.id.split("_")[0];
    let unitLabels = [];
    if(rb_type == "level"){
        unitLabels = levelUnitLabels;
    }
    else if(rb_type == "temp"){
        unitLabels = tempUnitLabels;
    }
    else{
        throw new Error(`Unknown radio button type: ${rb_type}!`);
    }
    // Get the correct unit for the type
    const unit = document.querySelector(`input[name="${rb_type}_mode"]:checked`).value;
    // Update all the other units
    for(let i = 0; i < unitLabels.length; i++){
        unitLabels[i].textContent = unit;
    }
}

function updateFavThresh(evt) {
    // The favorite to update
    let updateFav = getFavoriteById(siteSelect.value);
    console.log(updateFav);

    // Level entries
    const levelValues = ["low", "norm", "high", "too_high"];
    levelValues.forEach(level => {
        const val = document.getElementById(`${level}_level`).value;
        if(val != undefined && val != ""){
            updateFav[`${level}Level`] = val;
        }
    });

    // Temperature entries
    const tempValues = ["cold", "norm", "warm", "hot"];
    tempValues.forEach(level => {
        const val = document.getElementById(`${level}_temp`).value;
        if(val != undefined && val != ""){
            updateFav[`${level}Temp`] = val;
        }
    });

    // Update this favorite
    console.log(updateFav);
    updateFavorite(updateFav);

    // Prevent this event from submitting the form
    evt.preventDefault();
    evt.stopPropagation();
}

function updateFavoritesView() {
    // Get favorites from browser
    const favorites = getFavorites();

    // Clear existing
    favTab.innerHTML = '';

    var waterDivs = {};
    favorites.forEach(fav => {
        // Deal with the state
        if (!(fav.state in waterDivs)) {
            // Need to create a state (div)
            var stateDiv = document.createElement('div');
            stateDiv.id = `${fav.state}_div`;
            stateDiv.className = "stateDiv";

            // Create a header for this div
            let stateHeaderDiv = createFavHeader(fav.state, fav.state, 'state');
            // stateHeader.addEventListener("click", _favStateClick);
            stateDiv.appendChild(stateHeaderDiv);

            // Add the state div to the favorites div
            favTab.appendChild(stateDiv);

            // Update this to track it has been done
            waterDivs[fav.state] = {};
        }
        else {
            // Already have this state in favorites view
            stateDiv = document.getElementById(`${fav.state}_div`)
        }

        // Deal with the water body
        if (!(fav.water in waterDivs[fav.state])) {
            // Need to create a water div here
            var waterDiv = document.createElement('div');
            waterDiv.id = `${fav.state}_${fav.water}_div`;
            waterDiv.className = "waterDiv";
            waterDiv.style.display = "none";

            let waterHeader = createFavHeader(`${fav.state}_${fav.water}`, fav.water, 'water');
            waterDiv.appendChild(waterHeader);

            // Add this div to the overall div
            stateDiv.appendChild(waterDiv);
            waterDivs[fav.state][fav.water] = waterDiv;
        }
        else {
            // Already have this water in favorites view
            waterDiv = document.getElementById(`${fav.state}_${fav.water}_div`);
        }

        var siteItem = createFavSite(fav);
        siteItem.style.display = "none";
        waterDiv.appendChild(siteItem);
    });


    // Set a custom message here
    if (favorites.length == 0) {
        favTab.innerHTML = '<p style="color: gray">No Favorites</p>';
    }

    return favorites;
}

// Load the favorites here
let favorites = updateFavoritesView();

// Add these event listeners
stateSelect.addEventListener("change", updateWaterSelect);
waterSelect.addEventListener("change", updateSiteSelect);
siteSelect.addEventListener("change", updateFavoriteBtnStatus);
exploreForm.addEventListener("submit", gotoGauge)
favSiteBtn.addEventListener("click", _favBtnClick);
favWaterBtn.addEventListener("click", _favBtnClick);
updateFavThreshBtn.addEventListener("click", updateFavThresh);

// Add listeners to radio buttons
for(let i = 0; i < modeChangeOptions.length; i++){
    modeChangeOptions[i].addEventListener("change", updateEntryUnitLabels);
}

// Bind these to tab click
for (let i = 0; i < tabs.length; i++) {
    tabs[i].onclick = openTab;
}

// Check for no favorites, if no favorites to explore view
if (favorites.length == 0) {
    // This selects the "explore" tab
    tabs[1].click();
}
else {
    // This selects the "favorites" tab
    tabs[0].click();
}