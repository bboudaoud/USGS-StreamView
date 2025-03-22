"use strict";

import * as Explore from './explore.js';
import * as Favorites from "./favorites.js";

// High-level tabs
const tabs = document.getElementsByClassName("tablinks");
// Bind tab click events to method below
for (let i = 0; i < tabs.length; i++) {
    tabs[i].onclick = openTab;
}

// Explore setup
const waterSelect = document.getElementById("waterBody");
const siteSelect = document.getElementById("location");

const viewBtn = document.getElementById("viewBtn");
// Add a listener that goes to gauge but stops form submission here
viewBtn.addEventListener("click", function (evt) {
    Explore.gotoGauge();
    evt.preventDefault();
    evt.stopPropagation();
});

const dlFavBtn = document.getElementById("dlFavBtn");
dlFavBtn.onclick = Favorites.download;

const ulFavBtn = document.getElementById("ulFavBtn");
ulFavBtn.onclick = Favorites.upload;

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
    else if (id == "Explore") {
        if (waterSelect.value == "") Explore.updateWaterSelect();
        else if (siteSelect.value == "") Explore.updateSiteSelect();
        else Explore.updateSite();
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(id).style.display = "block";
    evt.currentTarget.className += " active";
}

// Check for no favorites, if no favorites to explore view
let favorites = Favorites.updateView
if (favorites.length == 0) {
    // This selects the "explore" tab
    tabs[1].click();
    Explore.updateWaterSelect();
}
else {
    // This selects the "favorites" tab
    tabs[0].click();
}