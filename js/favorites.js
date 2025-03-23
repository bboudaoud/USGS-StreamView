"use strict";

import * as Data from "./data.js";
import * as Draggable from "./draggable.js";

// Key to store the favorites in localStorage under
const FAV_KEY = 'favorites';

export const LEVEL_STAGES = ["low", "norm", "high", "too_high"];
const LEVEL_COLORS = {
    "low": "gray",
    "norm": "green",
    "high": "orange",
    "too_high": "red",
}

export const TEMP_LEVELS = ["cold", "norm", "warm", "hot"];
const TEMP_COLORS = {
    "cold": "darkblue",
    "norm": "green",
    "warm": "orange",
    "hot": "red",
}

// Elements
const favTab = document.getElementById("Favorites");
Draggable.setContainer(favTab);

export function getAll() {
    const j = localStorage.getItem(FAV_KEY);
    if (j == undefined) {
        return [];
    }
    return JSON.parse(j);
}

export function saveFavorites(favorites) {
    if (favorites != undefined) {
        localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    }
}

export function isFavorite(siteId) {
    // Check for this site in favorites
    const favorites = getAll();
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i].id == siteId) {
            return true;
        }
    }
    return false;
}

export function getById(siteId) {
    const favorites = getAll();
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i].id == siteId) {
            return favorites[i];
        }
    }
    return undefined;
}

export function add(fav) {
    // Get existing favorites
    var favorites = getAll();

    if (fav.state == "" || fav.state == undefined || fav.water == "" || fav.water == undefined || fav.loc == "" || fav.loc == undefined || fav.id == "" || fav.id == undefined) {
        return false;
    }

    // Add if not present
    if (!isFavorite(fav.id)) {
        // Add here
        favorites.push(fav);
        saveFavorites(favorites);
        updateView();
        console.log("ADD FAVORITE", fav);
    }
    // This indicates that this is now/aready was a favorite
    return true;
}

export function remove(fav) {
    if (fav == undefined) {
        return false;
    }

    let favorites = getAll();
    let favIdx = -1;
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i].id == fav.id) {
            favIdx = i;
        }
    }

    // Early exit for not present
    if (favIdx < 0) {
        // Did not find this favorite
        return false;
    }

    // Splice around index/remove from this list
    favorites.splice(favIdx, 1);

    // Remove the favorite from its list
    const favDiv = document.getElementById(`${fav.id}_fav_div`);
    const waterDiv = favDiv.parentElement;

    favDiv.remove();

    // Remove the water div if needed
    if (waterDiv.childNodes.length < 2) {
        waterDiv.remove();
    }

    // Update the memory
    saveFavorites(favorites);
    console.log("REMOVE FAVORITE", fav);
    return true;
}

export function update(fav) {
    var favorites = getAll();
    // Update this favorite
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i].id == fav.id) {
            // console.log("UPDATE FAVORITE", fav);
            favorites[i] = fav;
            break;
        }
    }

    // Update favorites with this value
    saveFavorites(favorites);
}

export function updateOrder(){
    var favorites = [];
    // Get the site divs (shoud be in order)
    const siteDivs = favTab.getElementsByClassName("siteDiv");
    for(let i = 0; i < siteDivs.length; i++){
        const siteId = siteDivs[i].id.split("_")[0];
        let fav = getById(siteId);
        if(fav != undefined){
            // This is a valid favorite
            favorites.push(fav);
        }
    };
    // Update the favorites with the new list
    saveFavorites(favorites);
}

export function download() {
    var a = document.createElement("a");
    const favStr = localStorage.getItem(FAV_KEY);
    const favs_file = new Blob([favStr], { type: "application/json" });
    a.href = URL.createObjectURL(favs_file);
    a.download = "favorites.json";
    a.click();
}

export function upload() {
    const ulFav = document.getElementById("favUl");
    // Create a listener to update the favorites
    ulFav.addEventListener("change", function (evt) {
        // Get file and reader
        const f = evt.target.files[0];
        const reader = new FileReader();
        // Setup the callback here
        reader.onload = function (event) {
            // Update the local storage here
            localStorage.setItem(FAV_KEY, event.target.result);
            console.log("UPLOAD FAVORITES", getAll());
        }
        // Read the text
        reader.readAsText(f);
    });
    // Create this upload
    ulFav.click();
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
    getAll().forEach(fav => {
        if (fav.state == state && fav.water == water) {
            toRemove.push(fav);
        }
    });
    toRemove.forEach(fav => remove(fav));

    // Remove the waterbody div
    const waterDiv = document.getElementById(`${state}_${water}_div`);
    waterDiv.remove();
}

function _favSiteRemove(evt) {
    const siteId = evt.target.id.split("_")[0];
    // Find and remove the site
    remove(getById(siteId));
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

export function getTempColor(fav, value) {
    if (fav == undefined) {
        return "black";
    }
    // See if we are in a range
    for (let i = 0; i < TEMP_LEVELS.length; i++) {
        const level = TEMP_LEVELS[i];
        if (`${level}Temp` in fav && value < fav[`${level}Temp`]) {
            return TEMP_COLORS[level];
        }
    }
    // Catch case here if above the max
    if ("hotTemp" in fav && value >= fav.hotTemp) {
        return "darkred";
    }
    // Case where nno keys are present in favorite
    return "black";
}

export function getLevelColor(fav, flow, height) {
    if (fav == undefined) {
        return "black";
    }
    // Give height priority
    var value;
    if (height != undefined && "levelUnits" in fav && fav.levelUnits == "ft") {
        value = height;
    }
    else if (flow != undefined && "levelUnits" in fav && fav.levelUnits == "cfs") {
        value = flow;
    }
    else {
        return "black";
    }
    // This is a height measurement
    for (let i = 0; i < LEVEL_STAGES.length; i++) {
        const stage = LEVEL_STAGES[i];
        if (`${stage}Level` in fav && value < fav[`${stage}Level`]) {
            return LEVEL_COLORS[stage];
        }
    }
    if ("too_highLevel" in fav && value >= fav.too_highLevel) {
        return "darkred";
    }
}

function createFavSite(fav) {
    let siteDiv = document.createElement('div');
    siteDiv.id = `${fav.id}_fav_div`;
    siteDiv.className = "siteDiv draggable";

    // Add name label
    let siteNameLabel = document.createElement("p");
    siteNameLabel.className = "siteNameText";
    siteNameLabel.innerHTML = `<a href=${Data.gaugeUrl(fav.state, fav.id, 30)} target=_blank>${fav.loc}</a>`;
    siteDiv.appendChild(siteNameLabel);

    // Add remove button
    siteDiv.appendChild(createRemoveButton(fav.id, 'site'));

    // Add stats
    let siteStats = document.createElement("div");
    siteStats.className = "siteStatsDiv";
    siteDiv.appendChild(siteStats);

    // Update the stats for this item
    Data.getLatestValues(fav.id).then(
        values => {
            const [flowVal, heightVal, tempVal] = values;
            // Handle the level string
            var levels = [];
            if (flowVal != undefined) {
                levels.push(`${flowVal} cfs`);
            }
            if (heightVal != undefined) {
                levels.push(`${heightVal} ft`);
            }
            let levelStr = ' ' + levels.join(', ') + ' ';
            if (levelStr.trim() != "") {
                // Create a paragraph for level and add it to site stats
                let levelStat = document.createElement("p");
                levelStat.id = `${fav.id}_fav_level`;
                levelStat.className = "siteStatText";
                levelStat.textContent = levelStr;
                levelStat.style.color = getLevelColor(fav, flowVal, heightVal);
                siteStats.appendChild(levelStat);
            }

            // Handle temperature
            if (tempVal != undefined) {
                let tempStat = document.createElement("p");
                tempStat.id = `${fav.id}_fav_temp`;
                tempStat.className = "siteStatText";
                tempStat.textContent = `${tempVal} °F`;
                tempStat.style.color = getTempColor(fav, tempVal);
                siteStats.appendChild(tempStat);
            }
        }
    );

    return siteDiv;
}

function updateFavSite(fav) {
    // Update the stats for this item
    Data.getLatestValues(fav.id).then(
        values => {
            const [flowVal, heightVal, tempVal] = values;
            // Handle the level string
            var levels = [];
            if (flowVal != undefined) {
                levels.push(`${flowVal} cfs`);
            }
            if (heightVal != undefined) {
                levels.push(`${heightVal} ft`);
            }
            let levelStr = ' ' + levels.join(', ') + ' ';
            if (levelStr.trim() != "") {
                // Create a paragraph for level and add it to site stats
                let levelStat = document.getElementById(`${fav.id}_fav_level`);
                if (levelStat != undefined) {
                    levelStat.textContent = levelStr;
                    levelStat.style.color = getLevelColor(fav, flowVal, heightVal);
                }
            }

            // Temperature
            if (tempVal != undefined) {
                let tempStat = document.getElementById(`${fav.id}_fav_temp`);
                if (tempStat != undefined) {
                    tempStat.textContent = `${tempVal} °F`;
                    tempStat.style.color = getTempColor(fav, tempVal);
                }
            }
        }
    );
}

export function updateView(favContainer = favTab) {
    // Get favorites from browser
    const favorites = getAll();

    favorites.forEach(fav => {
        // Easy here b/c we just have state divs
        const stateNames = new Set(Array.from(favContainer.children).map(v => v.id.split("_")[0]));
        if (!stateNames.has(fav.state)) {
            // Need to create a new state (div)
            var stateDiv = document.createElement('div');
            stateDiv.id = `${fav.state}_div`;
            stateDiv.className = "stateDiv";

            // Create a header for this div
            let stateHeaderDiv = createFavHeader(fav.state, fav.state, 'state');
            stateDiv.appendChild(stateHeaderDiv);

            // Add the state div to the favorites div
            favContainer.appendChild(stateDiv);
        }
        else {
            // Already have this state in favorites view
            stateDiv = document.getElementById(`${fav.state}_div`)
        }

        // Get a set of valid waternames
        let waterNames = new Set();
        stateDiv.childNodes.forEach(v => {
            if (v.className.includes("waterDiv")) {
                waterNames.add(v.id.split("_")[1]);
            }
        });
        // Deal with the water body
        if (!waterNames.has(fav.water)) {
            // Need to create a new water div
            var waterDiv = document.createElement('div');
            waterDiv.id = `${fav.state}_${fav.water}_div`;
            waterDiv.className = "waterDiv";
            waterDiv.style.display = stateDiv.style.display;

            let waterHeader = createFavHeader(`${fav.state}_${fav.water}`, fav.water, 'water');
            waterDiv.appendChild(waterHeader);

            // Add this div to the overall div
            stateDiv.appendChild(waterDiv);
        }
        else {
            // Already have this water in favorites view
            waterDiv = document.getElementById(`${fav.state}_${fav.water}_div`);
        }

        // This is easy again at the bottom of the stack
        const siteIds = new Set(Array.from(waterDiv.children).map((v => v.id.split("_")[0])));
        if (siteIds.has(fav.id)) {
            // Already exists, update it
            update(fav);
            // Recolor conditions if needed
            updateFavSite(fav);
        }
        else {
            // Create a new stream div
            var siteItem = createFavSite(fav);
            siteItem.style.display = "none";
            Draggable.addDraggable(siteItem);
            waterDiv.appendChild(siteItem);
        }
    });


    // Set a custom message here
    if (favorites.length == 0) {
        favContainer.innerHTML = '<p style="color: gray">No Favorites</p>';
    }

    return favorites;
}