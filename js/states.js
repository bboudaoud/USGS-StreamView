"use strict";

// Set up state options (constant)
export const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
    "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND",
    "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
].sort();

export function populateStateSelect(select) {
    // Add states to drop down
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.text = state;
        select.appendChild(option);
    });
    return select
}