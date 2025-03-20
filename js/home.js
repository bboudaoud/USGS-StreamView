"use strict";

import * as Data from "./data.js";
import * as Favorites from "./favorites.js";
import { populateStateSelect } from "./states.js";

// High-level
const tabs = document.getElementsByClassName("tablinks");
const exploreForm = document.getElementById("exploreForm");

// Explore form
const stateSelect = document.getElementById("state");
// Add states to drop down
populateStateSelect(stateSelect);
const waterSelect = document.getElementById("waterBody");
const siteSelect = document.getElementById("location");
const periodEntry = document.getElementById("periodDays");
const favWaterBtn = document.getElementById("favWaterbody")
const favSiteBtn = document.getElementById("favSite");
const favDiv = document.getElementById("favDiv");
const viewBtn = document.getElementById("viewBtn");

// Favorites
const modeChangeOptions = document.getElementsByClassName("modeRb");
const levelUnitLabels = document.getElementsByClassName("levelUnits");
const tempUnitLabels = document.getElementsByClassName("tempUnits");
const updateFavThreshBtn = document.getElementById("updateFavThreshBtn");

const dlFavBtn = document.getElementById("dlFavBtn");
dlFavBtn.onclick = Favorites.download;
const ulFavBtn = document.getElementById("ulFavBtn");
ulFavBtn.onclick = Favorites.upload;

// Storage for the selected state's sites (grouped by waterbody)
var sites = {};


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
        Favorites.updateView();
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(id).style.display = "block";
    evt.currentTarget.className += " active";
}

function gotoGauge() {
    const state = stateSelect.value;
    const siteId = siteSelect.value;
    const period = periodEntry.value;

    // Open in a new tab (for now)
    window.open(Data.gaugeUrl(state, siteId, period), "_blank")
}

// Callback from state select, updates the waterbody select options
// eslint-disable-next-line no-unused-vars
function updateWaterSelect(_evt = undefined, siteId = undefined) {
    // Clear and disable elements
    waterSelect.innerHTML = '';
    siteSelect.innerHTML = '';
    viewBtn.disabled = true;
    favSiteBtn.disabled = true;
    favWaterBtn.disabled = true;

    // Get dict of sites for this state
    Data.getSites(stateSelect.value).then(siteList => {
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
    updateFavoriteInfo();

    // Re-enable buttoons
    viewBtn.disabled = false;
    favSiteBtn.disabled = false;
    favWaterBtn.disabled = false;
}

// eslint-disable-next-line no-unused-vars
function updateFavoriteInfo(_evt) {
    // Update the water favorite button
    let fav_sites = [];
    Favorites.getAll().forEach(fav => {
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
    const isFav = Favorites.isFavorite(siteSelect.value);
    if (!isFav) {
        favSiteBtn.style.backgroundColor = "#AAA";
        favDiv.style.display = "none";
    }
    else {
        favSiteBtn.style.backgroundColor = "gold";
        favDiv.style.display = "block";
    }

    // If this is a favorite update any thresholds
    const fav = Favorites.getById(siteSelect.value);
    if (fav != undefined) {
        updateThresholdsFromFav(fav);
    }
}

function favBtnClick(evt) {
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

    // Determine whether this is already a favorite (if so unfavorite)
    let dropFav = false;
    if (mode == "site") {
        dropFav = Favorites.remove(Favorites.getById(siteSelect.value));
        if (!dropFav && siteSelect.selectedIndex >= 0) {
            // Create a new favorite
            const newFav = {
                state: stateSelect.value,
                water: waterSelect.value,
                loc: siteSelect.options[siteSelect.selectedIndex].text,
                id: siteSelect.value,
            };
            Favorites.add(newFav);
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
            Favorites.add(newFav);
        }
    }

    // Update the drawn status
    updateFavoriteInfo();

    // Prevent this event from submitting the form
    evt.preventDefault();
    evt.stopPropagation();
}

function updateEntryUnitLabels(evt) {
    const rb_type = evt.target.id.split("_")[0];
    let unitLabels = [];
    if (rb_type == "level") {
        unitLabels = levelUnitLabels;
    }
    else if (rb_type == "temp") {
        unitLabels = tempUnitLabels;
    }
    else {
        throw new Error(`Unknown radio button type: ${rb_type}!`);
    }
    // Get the correct unit for the type
    const unit = document.querySelector(`input[name="${rb_type}_mode"]:checked`).value;
    // Update all the other units
    for (let i = 0; i < unitLabels.length; i++) {
        unitLabels[i].textContent = unit;
    }
}

function updateThresholdsFromFav(fav) {
    // Set the level units (cfs/ft) from the selection
    if ("levelUnits" in fav) {
        const rb = document.querySelector(`input[type="radio"][value="${fav.levelUnits}"]`);
        rb.checked = true;
    }
    Favorites.LEVEL_STAGES.forEach(level => {
        const levelEntry = document.getElementById(`${level}_level`);
        levelEntry.value = "";
        if (`${level}Level` in fav) {
            levelEntry.value = fav[`${level}Level`];
        }
    });

    // Set the temp units (C/F) based on selection
    if ("tempUnits" in fav) {
        const rb = document.querySelector(`input[type="radio"][value="${fav.tempUnits}"]`);
        rb.checked = true;
    }
    Favorites.TEMP_LEVELS.forEach(level => {
        const tempEntry = document.getElementById(`${level}_temp`);
        tempEntry.value = "";
        if (`${level}Temp` in fav) {
            tempEntry.value = fav[`${level}Temp`];
        }
    });
}

function saveFavThresh(evt) {
    // The favorite to update
    let fav = Favorites.getById(siteSelect.value);

    // Level entries
    fav["levelUnits"] = document.querySelector(`input[name="level_mode"]:checked`).value;
    Favorites.LEVEL_STAGES.forEach(level => {
        const val = document.getElementById(`${level}_level`).value;
        if (val != undefined && val != "") {
            fav[`${level}Level`] = val;
        }
    });

    // Temperature entries
    fav["tempUnits"] = document.querySelector(`input[name="temp_mode"]:checked`).value;
    Favorites.TEMP_LEVELS.forEach(level => {
        const val = document.getElementById(`${level}_temp`).value;
        if (val != undefined && val != "") {
            fav[`${level}Temp`] = val;
        }
    });

    // Update this favorite
    Favorites.update(fav);

    // Prevent this event from submitting the form
    evt.preventDefault();
    evt.stopPropagation();
}

// Load the favorites here
let favorites = Favorites.updateView();

// Add these event listeners
stateSelect.addEventListener("change", updateWaterSelect);
waterSelect.addEventListener("change", updateSiteSelect);
siteSelect.addEventListener("change", updateFavoriteInfo);
favSiteBtn.addEventListener("click", favBtnClick);
favWaterBtn.addEventListener("click", favBtnClick);
updateFavThreshBtn.addEventListener("click", saveFavThresh);
viewBtn.onclick = gotoGauge;
exploreForm.addEventListener("submit", gotoGauge)

// Add listeners to radio buttons
for (let i = 0; i < modeChangeOptions.length; i++) {
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