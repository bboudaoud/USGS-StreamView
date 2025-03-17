// These are possible (core) waterbody types
const WATER_BODY_TYPES = [
    "BRANCH",
    "BROOK",
    "CHANNEL",
    "CREEK",
    "DITCH",
    "DRAFT",
    "FORK",
    "LAKE",
    "RIVER",
    "RUN",
    "SWAMP",
    "STORM DRAIN",
 ];

//  This renames some common misspellings/abbreviations into valid types
const WATERBODY_TYPE_RENAME = {
    "CR": "CREEK",
    "CK": "CREEK",
    "CRK": "CREEK",
    "CHAN": "CHANNEL",
    "DCH": "DITCH",
    "LK": "LAKE",
    "RIV": "RIVER",
    "R": "RIVER",
};

// These can delimit the location from its waterbody
const LOC_SPLITTERS = [
    "ABOVE",
    "ABV",
    "AB",
    "ALONG",
    "AT",
    "BELOW",
    "BL",
    "BLW",
    "NEAR",
    "NR",
];
// Rename some common abbreviations
const LOC_RENAME = {
    "AB": "ABOVE",
    "ABV": "ABOVE",
    "BL": "BELOW",
    "BLW": "BELOW",
    "NR": "NEAR",
}

function splitNameLoc(name) {
    var first_idx = 1e9;
    var body = undefined;
    var loc = undefined;
    // See if each location splitter is found first here
    LOC_SPLITTERS.forEach(s => {
        // Search for the splitter as a distinct word (spaces)
        split_str = ` ${s} `;
        let idx = name.indexOf(split_str)
        if(idx > 0 && idx < first_idx){
            // Found this index before the first so far
            first_idx = idx;
            // Update water body and location
            body = name.split(split_str)[0] + " ";
            // Rename if needed
            let loc_field = s;
            if(s in LOC_RENAME){
                loc_field = LOC_RENAME[s];
            }
            // Rebuild location from location split field and back end
            loc = loc_field + " " + name.split(split_str).slice(1).join(split_str);
        }
    });

    if(body == undefined){
        // Early exit here
        return [undefined, undefined];
    }

    // Attempt to rename some waterbodies
    for(let n in WATERBODY_TYPE_RENAME){
        let swap_str = ` ${n} `;
        if(body.includes(swap_str)){
            body = body.replace(swap_str, WATERBODY_TYPE_RENAME[n]);
        }
    }
    return [body.trim(), loc.trim()];
}

function parseSites(siteList, valid_names = ["Gage height", "Streamflow", "Temperature, water"]){
    let sites = {};
    for(let i = 0; i < siteList.length; i++){
        const site = siteList[i];
        const siteName = site.sourceInfo.siteName.toUpperCase();
        
        // Skip things that start w/ numbers for now
        if(siteName.match(/^\d/)){
            continue;
        }
        
        // Split the site name into a waterbody and location
        let [waterbody, location] = splitNameLoc(siteName);
        if(waterbody == undefined || location == undefined){
            // Pass through case here for failed split
            waterbody = siteName;
            location = siteName;
        }

        // Check that a valid sensor is present
        var is_valid = false;
        const var_name = site.variable.variableName;
        valid_names.forEach(name => {
            if(var_name.includes(name)){
                return is_valid = true;
            }
        })
        if(!is_valid){
            // We did not get a valid variable name to list this gauge 
            continue;
        }

        // Check for waterbody name in name (split if needed)
        WATER_BODY_TYPES.forEach(wb => {
            if(waterbody.match(`(?<!\\s)${wb}`)){
                let wb_idx = waterbody.indexOf(wb);
                if(wb_idx == 0){
                    // Case where water body comes first (e.g, Lake Anna)
                    waterbody = wb + " " + waterbody.substr(wb.length + 1);
                }
                else {
                    // Common case where its [X] river/creek/lake etc.
                    waterbody = waterbody.replace(wb, "") + " " + wb;
                }
            }
        });

        // Only do this for valid waterbodies
        if(!(waterbody in sites)){
            sites[waterbody] = {};
        }
        const site_id = site.sourceInfo.siteCode[0].value;
        sites[waterbody][location] = site_id;
    }

    // Sort sites by name
    var sorted_sites  = {};
    Object.keys(sites).sort().forEach(key => {
        sorted_sites[key] = sites[key];
    });
    return sorted_sites;
}