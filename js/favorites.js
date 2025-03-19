"use strict";

import * as Data from "./data.js";

// Key to store the favorites in localStorage under
const FAV_KEY = 'favorites';

// Elements
const favTab = document.getElementById("Favorites");

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
        console.log("ADD FAVORITE", fav);
    }
    // This indicates that this is now/aready was a favorite
    return true;
}

export function remove(fav) {
    var favorites = getAll();

    let favIdx = -1;
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i].id == fav.id) {
            favIdx = i;
        }
    }

    // Early exit for not present
    if (favIdx < 0) {
        // Did not find this favorite
        return;
    }
    // Splice around index/remove from this list
    favorites.splice(favIdx, 1);
    console.log("REMOVE FAVORITE", fav);
    // Update the memory
    saveFavorites(favorites);
}

export function update(fav) {
    var favorites = getAll();
    // Update this favorite
    for (let i = 0; i < favorites.length; i++) {
        if (favorites[i].id == fav.id) {
            console.log("UPDATE FAVORITE", fav);
            favorites[i] = fav;
            break;
        }
    }
    // Update favorites with this value
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

export function updateView(favContainer = favTab) {
    // Get favorites from browser
    const favorites = getAll();

    // Clear existing
    favContainer.innerHTML = '';

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
            favContainer.appendChild(stateDiv);

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
        favContainer.innerHTML = '<p style="color: gray">No Favorites</p>';
    }

    return favorites;
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
    // Update the view
    updateView();
}

function _favSiteRemove(evt) {
    const siteId = evt.target.id.split("_")[0];
    getAll().forEach(fav => {
        if (fav.id == siteId) {
            remove(fav);
            updateView();
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

function getLatestValues(site) {
    // Return a spot result
    return Data.getDataForSite(site).then(data => {
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

function tempColor(fav, value){
    if("hotTemp" in fav && value >= fav.hotTemp){
        return "red";
    }
    if("warmTemp" in fav && value >= fav.warmTemp){
        return "orange";
    }
    if("normTemp" in fav && value >= fav.normTemp){
        return "green";
    }
    if("coldTemp" in fav && value >= fav.coldTemp){
        return "darkblue";
    }
    return "black";
}

function levelColor(fav, flow, height){
    if("" in fav){
        return;
    }
}

function createFavSite(fav) {
    let siteDiv = document.createElement('div');
    siteDiv.id = `${fav.id}_fav_div`;
    siteDiv.className = 'siteDiv';

    // Add name label
    let siteNameLabel = document.createElement("p");
    siteNameLabel.className = "siteNameText";
    siteNameLabel.innerHTML = `<a href=${Data.gaugeUrl(fav.state, fav.id, 30)} target=_blank>${fav.loc}</a>`;
    siteDiv.appendChild(siteNameLabel);

    // Add stats
    let siteStats = document.createElement("div");
    siteStats.className = "siteStatsDiv";
    siteDiv.appendChild(siteStats);

    // Update the stats for this item
    getLatestValues(fav.id).then(
        values => {
            const [flowVal, heightVal, tempVal] = values;
            // Handle the level string
            var levelStr = "";
            if (flowVal != undefined) {
                levelStr += `${flowVal} cfs  `;
            }
            if (heightVal != undefined) {
                levelStr += `${heightVal} ft   `;
            }
            levelStr = levelStr.trim();
            if(levelStr != ""){
                // Create a paragraph for level and add it to site stats
                let levelP = document.createElement("p");
                levelP.className = "siteStatText";
                levelP.textContent = levelStr;
                siteStats.appendChild(levelP);
            }

            // Handle flow string
            if (tempVal != undefined) {
                let tempP = document.createElement("p");
                tempP.className = "siteStatText";
                tempP.textContent = `${tempVal} °F`;
                tempP.style.color = tempColor(fav, tempVal);
                siteStats.appendChild(tempP);
            }
        }
        // Handle color coding

    );

    // Add remove button
    siteDiv.appendChild(createRemoveButton(fav.id, 'site'));

    return siteDiv;
}