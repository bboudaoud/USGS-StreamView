"use strict";

const FAV_KEY = 'favorites';

export function getFavorites() {
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
    const favorites = getFavorites();
    for(let i = 0; i < favorites.length; i++){
        if (favorites[i].id == siteId){
            return true;
        }
    }
    return false;
}

export function getFavoriteById(siteId) {
    const favorites = getFavorites();
    for(let i = 0; i < favorites.length; i++){
        if(favorites[i].id == siteId){
            return favorites[i];
        }
    }
    return undefined;
}

export function addFavorite(fav) {
    // Get existing favorites
    var favorites = getFavorites();

    if (fav.state == "" || fav.state == undefined || fav.water == "" || fav.water == undefined || fav.loc == "" || fav.loc == undefined || fav.id == "" || fav.id == undefined) {
        return false;
    }

    // Add if not present
    if (!isFavorite(fav.id)) {
        // Add here
        favorites.push(fav);
        saveFavorites(favorites);
        console.log("ADD FAVORITE: ", fav);
    }
    // This indicates that this is now/aready was a favorite
    return true;
}

export function removeFavorite(fav) {
    var favorites = getFavorites();

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
    console.log("REMOVE FAVORITE: ", fav);
    // Update the memory
    saveFavorites(favorites);
}

export function updateFavorite(fav) {
    var favorites = getFavorites();
    // Update this favorite
    for(let i = 0; i < favorites.length; i++){
        if(favorites[i].id == fav.id){
            favorites[i] = fav;
            break;
        }
    }
    // Update favorites with this value
    saveFavorites(favorites);

}