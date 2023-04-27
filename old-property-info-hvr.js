let backendPath = "https://hhvjdbhqp4.execute-api.us-east-1.amazonaws.com/prod";
// let backendPath = "https://1snwvce58a.execute-api.us-east-1.amazonaws.com/dev";

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function addUnit(address, unit) {
    if (typeof unit != "undefined" && unit.length > 0) {
        let addressTokens = address.split(',');
        let street = addressTokens[0];
        street = street + " Unit " + unit;
        addressTokens.shift();
        let addressEnding = addressTokens.join(',');
        address = street + ',' + addressEnding;
    }
    console.log('Formed address ' + address + ' from address and unit');
    return address;
}

function formUnitAddressString(street, unitNumber, city, state, zip) {
    let addressString = street + ' Unit ' + unitNumber + ', ' + city + ', ' + state + ' ' + zip;
    return addressString
}

function addZipCode(address, zip) {
    if (typeof zip != "undefined" && zip.length > 0) {
        address = address + ' ' + zip;
    }
    console.log('Formed address ' + address + ' from address and zip');
    return address;
}

function parseValuationResult(result) {
    try {
        let estimatedValue = result.EstimatedValue;
        let estimatedMinValue = result.EstimatedMinValue;
        let estimatedMaxValue = result.EstimatedMaxValue;
        let confidenceScore = result.ConfidenceScore;
        console.log('Got estimate of ' + estimatedValue);

        if ((estimatedValue === "" || estimatedValue === "$0" || estimatedValue === "$NaN" || typeof estimatedValue === "undefined")) {
            throw 'Unable to pull value estimates';
        } else {
            let adjustedEstimate = estimatedValue;
            console.log('Got adjustedEstimate: ' + adjustedEstimate);
            $("#value-estimate-storage").attr("value", adjustedEstimate); // added 12-27-2022 to decide whether to show failure page
            $(".selling-estimate").html(adjustedEstimate);
            $(".selling-estimate").val(adjustedEstimate);
            $(".value-estimate").html(estimatedValue);
            $(".value-estimate").val(estimatedValue);
            $(".value-estimate-min").html(estimatedMinValue);
            $(".value-estimate-min").val(estimatedMinValue);
            $(".value-estimate-max").html(estimatedMaxValue);
            $(".value-estimate-max").val(estimatedMaxValue);

            $(".confidence-score").html(confidenceScore);
            $(".confidence-score").val(confidenceScore);
        }
    } catch (error) {
        console.log(error);
        $("#failed-property-pull").attr("value", "true"); // NEW - ADDED 12-29-2022 to set and send with forms (e.g., request detailed report form)        
        // $(".offer-header").html("We were unable to pull your value report");
        // $(".value-estimate").html("$-");
        // $(".value-estimate-min").html("$-");
        // $(".value-estimate-max").html("$-");
        // $(".confidence-score").html(0);
        // $(".value-estimate").val("$-");
        // $(".value-estimate-min").val("$-");
        // $(".value-estimate-max").val("$-");
        // $(".confidence-score").val(0);
        // $("#offer-explanation").hide();
        // $("#schedule-walkthrough").hide();
    }
}

// function pullPropertyInfo(address, street, city, state, zip, agentId, domain) {
function pullPropertyInfo(address, agentId, domain) {

    /* Currently, each pullPropertyInfo request returns a new sessionId */
    let propertyRequest = {
        "address": address,
        // "validatedStreet": street, // for the skiptrace if property info pull fails
        // "ValidatedCity": city,
        // "validatedState": state,
        // "validatedZip": zip, // for the skiptrace if property info pull fails
        "agentId": agentId,
        "site": domain
    };

    // ADDED 8/22/22 - Use existing sessionId if it exists
    let sessionId = $("#session-id-storage").val();
    console.log('Pulled this existing sessionId from session-id-storage before requesting property info: ' + sessionId);
    if (typeof sessionId != "undefined" && sessionId.length > 0) {
        propertyRequest['sessionId'] = sessionId;
    }

    console.log('Pulling property info for ' + address);
    let url = backendPath + "/property";
    $.ajax({
        url: url,
        method: 'POST',
        data: JSON.stringify(propertyRequest),
    }).done(function (result) {
        let property = result.Property;
        let sessionId = result.sessionId; // this becomes the sessionId that tracks subsequent changes
        $("#session-id-storage").attr("value", sessionId); // this becomes the sessionId that tracks subsequent changes
        $("#session-id-failure-page").attr("value", sessionId); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        document.getElementById("session-id-failure-page").value = sessionId; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        // $('.session-id-storage-class').attr("value", sessionId); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        // $('.session-id-storage-class').html(sessionId); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        // $(".session-id-storage-class").children().val(sessionId); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        console.log('Pulled this property: ' + property);
        console.log('Pulled this sessionId: ' + sessionId);
        return parseValuationResult(property);
    }).fail(function (err) {
        console.log('Unabled to pull home value estimate');
        console.log(err);
        $("#failed-property-pull").attr("value", "true"); // NEW - ADDED 12-29-2022 to set and send with forms (e.g., request detailed report form)

    });
}


function storeValidatedAddressComponents(validationResult) {
    // PARSE AND STORE VALIDATED ADDRESS COMPONENTS                         
    let addressDisplayText = validationResult.addressTextModified;
    $(".address-display").html(addressDisplayText);
    $("#address-send").attr("value", addressDisplayText); // for the form submission(s); potentially move down to unit submit section and send "unitAddress"
    $("#address-storage").attr("value", addressDisplayText); // house number, street, and unit (if any)

    // $('.address-storage-class').attr("value", address); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
    // $('.address-storage-class').html(address); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
    // $(".address-storage-class").children().val(addressDisplayText); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
    $("#address-failure-page").attr("value", addressDisplayText); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
    document.getElementById("address-failure-page").value = addressDisplayText; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)

    // $("#street-storage").attr("value", validationResult.street);
    $("#street-storage").attr("value", validationResult.streetNoUnit); // NOTE 1/4/2023 - WE need without unit, so can add unit on if it needs a corrected unit. "addressLine1" may also work. 
    $("#unit-storage").attr("value", validationResult.unit); // should be included above in street, I think
    $("#unit-type-storage").attr("value", validationResult.unitType); // sub-premises type
    $("#city-storage").attr("value", validationResult.city);
    $("#state-storage").attr("value", validationResult.state);
    $("#zip-storage").attr("value", validationResult.zip);
}


function proceedAfterAddressValidated(address) {
    // REQUEST PROPERTY INFO FROM BACKEND
    let agentId = $("#agent-id-storage").val();
    let site = $("#domain-storage").val();
    // let address = $("#address-storage").val(); // house number, street, and unit (if any)
    pullPropertyInfo(address, agentId, site); // alternatively, we could do this in the address valdation endpoint

    $("#zip-code-page").hide();
    $("#condo-unit-page").hide(); // may have never gotten here
    $("#confirm-unit-page").hide(); // may have never gotten here
    $("#enter-different-unit-page").hide(); // may have never gotten here
    $("#invalid-address-page").hide(); // for good measure(?)
    $("#relationship-page").show();
}

// function validateAddress(address) {
function validateAddress(address, startSession) {
    let agentId = $("#agent-id-storage").val();
    console.log('About to validate address: ' + address);

    let url = backendPath + "/address";
    let request = { "address": address, "agentId": agentId };

    // ADDED 3/10/23 - Use existing sessionId if it exists
    if (!startSession) {
        let sessionId = $("#session-id-storage").val();
        if (typeof sessionId != "undefined" && sessionId.length > 0) {
            console.log('Pulled this existing sessionId from session-id-storage before validating address: ' + sessionId);
            request["sessionId"] = sessionId;
        }
    } else {
        request["startSession"] = startSession;
    }
    $.ajax({
        url: url,
        method: 'POST',
        data: JSON.stringify(request), // data: JSON.stringify(sellingDetails),
    }).done(function (result) {
        console.log('Validation result ' + result);
        console.log('Invalid address? ' + result.invalidAddress);
        console.log('Submitted address ' + result.submittedAddress);

        // ADDED 03/10/2023 - FOR TAKING SESSION IDs from backend
        let sessionId = result.sessionId; // this becomes the sessionId that tracks subsequent changes
        $("#session-id-storage").attr("value", sessionId); // this becomes the sessionId that tracks subsequent changes
        $("#session-id-failure-page").attr("value", sessionId); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        document.getElementById("session-id-failure-page").value = sessionId; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)

        $('#updating-home-details-loader').hide()
        // $('#updating-home-details-loader').css('display', 'flex');
        $('#market-analysis-loader').hide(); // maybe rename to "address-loader"
        try {
            storeValidatedAddressComponents(result); // NEW 1/4/2022 - this would ALWAYS run, so elements SHOULD be safely overridden
            if (!result.invalidAddress) {
                console.log('Looks like it was a valid address');
                // REQUEST PROPERTY INFO FROM BACKEND
                // NEW 1/4/2022 - THE ABOVE WRAPPED IN FUNCTION CALLS
                // await storeValidatedAddressComponents(result); // NEW 1/4/2022 - is the await necessary? We definitely need the address to be there 
                // storeValidatedAddressComponents(result); // NEW 1/4/2022 - is the await necessary? We definitely need the address to be there 
                proceedAfterAddressValidated(result.addressTextModified);
            } else if (result.invalidZip) {
                let addressDisplayText = address;
                $("#address-failure-page").attr("value", addressDisplayText); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
                document.getElementById("address-failure-page").value = addressDisplayText; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
                $(".address-display").html(addressDisplayText);
                $("#address-storage").attr("value", addressDisplayText);
                $("#relationship-page").hide();
                $("#invalid-address-page").hide();
                $("#zip-code-page").show();
            } else if ((result.needUnit && !result.unitProvided)) {
                console.log('We need a unit and it looks like NO unit was provided');
                let addressDisplayText = result.addressTextModified;
                console.log('addressDisplayText: ' + addressDisplayText);
                $("#address-failure-page").attr("value", addressDisplayText); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
                document.getElementById("address-failure-page").value = addressDisplayText; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
                $(".address-display").html(addressDisplayText);
                $("#address-storage").attr("value", addressDisplayText);
                $("#relationship-page").hide();
                $("#zip-code-page").hide();
                $("#invalid-address-page").hide();
                $("#condo-unit-page").show();
            } else if ((result.needUnit && result.invalidUnit)) {
                console.log('We need a unit and it looks an invalid one was provided');
                let addressDisplayText = result.addressTextModified;
                console.log('addressDisplayText: ' + addressDisplayText);
                $("#address-failure-page").attr("value", addressDisplayText); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
                document.getElementById("address-failure-page").value = addressDisplayText; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)

                let unitCorrectionAttempted = $("#unit-correction-attempted").val();
                if (unitCorrectionAttempted) {
                    console.log('Proceeding because already attempted to correct the unit');
                    storeValidatedAddressComponents(result);
                    proceedAfterAddressValidated(result.addressTextModified);
                } else {
                    console.log('Have not yet attempted to correct the unit; doing so now');
                    $("#unit-correction-attempted").attr("value", "true"); // ADDED 1/4/2022 - SET INDICATOR for whether to keep asking for unit
                    $(".address-display").html(addressDisplayText);
                    $("#address-storage").attr("value", addressDisplayText);
                    $("#relationship-page").hide();
                    $("#zip-code-page").hide();
                    $("#invalid-address-page").hide();
                    $("#condo-unit-page").hide();
                    $("#confirm-unit-page").show();
                }
            } else {
                let addressCorrectionAttempted = $("#address-correction-attempted").val();
                if (addressCorrectionAttempted) {
                    console.log('Proceeding because already attempted to correct the address');
                    storeValidatedAddressComponents(result);
                    // proceedAfterAddressValidated(result.addressTextModified); // or should we do result.submittedAddress?
                    proceedAfterAddressValidated(result.submittedAddress); // or should we do result.submittedAddress?
                } else {
                    console.log('Invalid address...deciding what to do next');
                    $("#address-correction-attempted").attr("value", "true"); // ADDED 1/4/2022 - SET INDICATOR for whether to keep asking for unit
                    $("#zip-code-page").hide();
                    $("#condo-unit-page").hide();
                    $("#relationship-page").hide(); // but wouldn't it be this?
                    $("#invalid-address-page").show();
                    let errorMessage = 'We were unable to validate that address';
                    if (result.extraneousUnitProvided) {
                        errorMessage = 'Did you mean to submit a unit number?';
                    }
                    $(".address-error-message").html(errorMessage);
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
}

// $(document).ready(function () {
//     let queryString = window.location.search;
//     let params = new URLSearchParams(queryString);
//     let site = params.get("site");
//     let address = params.get("address");
//     let agentId = params.get("agent");
//     let contactRequired = params.get("contactRequired");

//     console.log('Pulled address from queryString: ' + address);
//     console.log('Pulled source site from queryString: ' + site);
//     console.log('Pulled agent from queryString: ' + agentId);
//     console.log('Pulled contactInfoRequired from queryString: ' + contactRequired);

//     if (typeof contactRequired == "undefined") {
//         contactRequired = true;
//     }
//     $("#contact-required").attr("value", contactRequired);

//     if (!site || !address || !agentId) {
//         let routeTo = "https://my.homevalue.report";
//         // let queryString = '?address=' + encodeURIComponent(address) + '&agent=' + encodeURIComponent(agentId) + '&site=' + encodeURIComponent(site);
//         // routeTo = routeTo + queryString;
//         console.log('Routing to URL ' + routeTo);
//         location.href = routeTo;
//     }

//     // history.replaceState({}, null, "/value");  

//     // IT'S possible that we should query with the source site name here to ensure safety
//     $("#agent-id-storage").attr("value", agentId);
//     console.log(agentId);

//     // UPDATE ADDRESS DISPLAY AND STORAGE FIELDS
//     $(".address-display").html(address);
//     $("#address-storage").attr("value", address); // NOTE - consider removing
//     $("#address-failure-page").attr("value", address); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//     document.getElementById("address-failure-page").value = address; // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//     // $('.address-storage-class').attr("value", address); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//     // $('.address-storage-class').val(address); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//     // $('.address-storage-class input').val(address); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)

//     // STORE THE SOURCE USER CAME FROM
//     $("#domain-storage").attr("value", site); // get with $("#domain-storage").val();

//     // HIDE UNUSED LOADERS
//     $("#market-analysis-loader").show();
//     // $('#updating-home-details-loader').removeClass('hide');
//     $('#updating-home-details-loader').hide();

//     validateAddress(address, true);
//     history.replaceState({}, null, "value");
//     setTimeout(function () { $("#market-analysis-loader").hide(); }, 2500);
// });

document.getElementById("no-unit-btn").addEventListener('click', (event) => {
    console.log('Just clicked no unit btn');
    console.log('Progressing without re-validating the no-unit address');
    $("#unit-storage").attr("value", ""); // NOTE - NEW ADDED 12/19/22
    $(".unit-display").html(""); // NOTE - NEW ADDED 01/04/22
    $("#condo-unit-page").hide();
    $("#relationship-page").show(); // NOTE - NEW ADDED 01/04/22; previously (and still) handled by a Webflow legacy interaction

    // NOTE - NEW ADDED 3/10/2023 - just attempt the property pull anyway
    let address = $("#address-storage").val();
    let agentId = $("#agent-id-storage").val();
    let site = $("#domain-storage").val();
    pullPropertyInfo(address, agentId, site); // we either need to do this here OR just go ahead and set ... 
    // $("#failed-property-pull").attr("value", "true");
});

document.getElementById("unit-submit-btn").addEventListener('click', (event) => {
    // STORE UNIT
    let unit = document.getElementById("unit-input").value.trim();
    $("#unit-storage").attr("value", unit); // NOTE - NEW ADDED 12/19/22
    $(".unit-display").html(unit); // NOTE - NEW ADDED 01/04/22
    console.log('User entered unit: ' + unit);

    // UPDATE ADDRESS
    console.log('Adding unit to address : ' + unit);
    let address = $("#address-storage").val();
    console.log('Adding to address from storage: ' + address);

    let unitAddress = addUnit(address, unit);
    console.log('Now validating the address with the unit added: ' + unitAddress);

    // SHOW LOADER
    $('#updating-home-details-loader').removeClass('hide');

    // VALIDATE ADDRESS
    validateAddress(unitAddress, false); // don't set condo (false), because already did on first pull
});

document.getElementById("unit-correction-submit-btn").addEventListener('click', (event) => {
    // STORE UNIT
    let unit = document.getElementById("unit-correction-input").value.trim();
    $("#unit-storage").attr("value", unit); // NOTE - NEW ADDED 12/19/22
    $(".unit-display").html(unit); // NOTE - NEW ADDED 01/04/22
    console.log('User entered unit: ' + unit);

    // UPDATE ADDRESS
    console.log('Adding unit to address : ' + unit);
    // let address = $("#address-storage").val();
    // console.log('Adding to address from storage: ' + address);
    let street = $("#street-storage").val(); // NEW 1/4/2022 - these should all be set during the initial address validation attempt
    let city = $("#city-storage").val();
    let state = $("#state-storage").val();
    let zip = $("#zip-storage").val();

    // let unitAddress = addUnit(address, unit);
    let unitAddress = formUnitAddressString(street, unit, city, state, zip);

    // SHOW LOADER
    $('#updating-home-details-loader').removeClass('hide');

    // VALIDATE ADDRESS
    validateAddress(unitAddress, false); // don't set condo (false), because already did on first pull
});

document.getElementById("unit-is-correct-btn").addEventListener('click', (event) => {
    // PRETEND LIKE THE ADDRESS WAS VALIDATED
    let address = $("#address-storage").val();
    proceedAfterAddressValidated(address);
});

document.getElementById("new-unit-needed-btn").addEventListener('click', (event) => {
    $("#confirm-unit-page").hide();
    $("#relationship-page").hide(); // NOT sure why this is needed, but looks like it is
    $("#enter-different-unit-page").show();
});

document.getElementById("zip-submit-btn").addEventListener('click', (event) => {
    let zipCode = document.getElementById("zip-code-input").value.trim();
    $("#zip-storage").attr("value", zipCode); // NOTE - NEW ADDED 1/4/2022 (not sure it's necessary)

    let address = $("#address-storage").val();
    console.log('Adding to address from storage: ' + address);

    let zipCodeAddress = addZipCode(address, zipCode);

    // SHOW LOADER
    $('#updating-home-details-loader').removeClass('hide');

    // VALIDATE ADDRESS
    validateAddress(zipCodeAddress, false); // should overwrite any invalid address items
    setTimeout(function () { $("#market-analysis-loader").hide(); }, 2500);
});

window.onbeforeunload = function () {
    let finished = $("#finished").val();
    console.log("finished? " + finished);
    let warningMessage = null;
    if (!finished) {
        console.log('Setting warning');
        warningMessage = 'Are you sure you want to leave?';
    }
    console.log(warningMessage);
    return warningMessage;
};

function mobileCheck() {
    let isMobile = false;
    if ((window.matchMedia("(max-width: 767px)").matches) && (!!('ontouchstart' in window))) {
        isMobile = true;
    }
    return isMobile;
};

function handleBounce() {
    let finished = $("#finished").val(); // has a value if already bounced or reached report
    // let failedPropertyInfo = $("#failed-property-pull").val();
    // console.log("Checking for failed property pull in handbounce: " + failedPropertyInfo);
    // if (!finished && !failedPropertyInfo) { // but if they bounce very early, this won't work. It will attempt to update the session. 
    if (!finished) { // but if they bounce very early, this won't work. It will attempt to update the session.         
        let sessionInfo = getCurrentSessionInfo();
        sessionInfo["finished"] = false;
        sessionInfo["bounced"] = true;
        if (sessionInfo["sessionId"]) {
            console.log('Sending a beacon because we do have a sessionId: ' + sessionInfo["sessionId"]);
            sessionInfo = JSON.stringify(sessionInfo);
            navigator.sendBeacon(backendPath + "/session", sessionInfo);
        }
        $("#finished").attr("value", "no"); // technically "bounced", but just needs any value so we don't re-notify
    }
}

window.onunload = function () {
    handleBounce();
};

document.onvisibilitychange = function () {
    console.log('Visibility change');
    let mobileDevice = mobileCheck();
    console.log('Mobile: ' + mobileDevice);
    if ((mobileDevice) && (document.visibilityState === 'hidden')) {
        handleBounce();
    }
};

function updateSession(sessionFields) {
    console.log('Right before updateSession()');
    let request = $.ajax({
        url: backendPath + "/session",
        method: "POST",
        data: JSON.stringify(sessionFields),
    });

    request.done(function (data) {
        console.log("SUCCESS: " + data);
    });

    request.fail(function () {
        console.log("Request failed");
    });
}

function getCurrentSessionInfo() {

    let site = $("#domain-storage").val();
    let agentId = $("#agent-id-storage").val();
    let sessionId = $("#session-id-storage").val();
    console.log('Got sessionId from div before submit: ' + sessionId);
    console.log('Got agentId from div before submit: ' + agentId);

    // PULL validated address info to attempt the skiptrace in the backend
    let validatedStreet = $("#street-storage").val();
    let validatedUnit = $("#unit-storage").val();
    let validatedUnitType = $("#unit-type-storage").val();
    let validatedCity = $("#city-storage").val();
    let validatedState = $("#state-storage").val();
    let validatedZip = $("#zip-storage").val();
    console.log('Got validated street from div before submit: ' + validatedStreet);
    console.log('Got validated zip from div before submit: ' + validatedZip);

    let addressSend = $("#address-storage").val();

    let submittedName;
    try {
        submittedName = $("#name-input").val(); // 7/10/2022 - was "#First-Name"
        if (submittedName.length <= 1) {
            submittedName = '-';
        }
    } catch (error) {
        console.log(error);
        submittedName = ' ';
    }

    let submittedNumber;
    try {
        submittedNumber = $("#phone-input").val();
        if (submittedNumber.length <= 5) {
            submittedNumber = '-';
        }
    } catch (error) {
        console.log(error);
        submittedNumber = ' ';
    }

    let sessionInfo = {
        "site": site,
        "sessionId": sessionId,
        "agentId": agentId,
        "Submitted-Address": addressSend, // "Submitted Address": addressSend,
        "Submitted-Name": submittedName,
        "Submitted-Number": submittedNumber,
        "validatedStreet": validatedStreet, // for the skiptrace if property info pull fails
        "validatedUnit": validatedUnit,
        "validatedUnitType": validatedUnitType,
        "ValidatedCity": validatedCity,
        "validatedState": validatedState,
        "validatedZip": validatedZip, // for the skiptrace if property info pull fails                
    }

    let checkRadioNames = ["Relationship-to-Home", "Considering-Selling"];
    for (const checkRadioName of checkRadioNames) {
        console.log('Checking radio selections for ' + checkRadioName);
        let sellerDetails = checkSellerDetails(checkRadioName);
        sessionInfo[checkRadioName] = sellerDetails;
    }

    console.log('Sending this sessionInfo: ' + sessionInfo);

    return sessionInfo;
}

function checkSellerDetails(name) {
    let checkedRadio = document.querySelector('input[name="' + name + '"]:checked');

    let checkedValue;
    if (checkedRadio != null) {
        checkedValue = checkedRadio.value
    } else {
        checkedValue = "None given";
    }
    return checkedValue;
}

// const delay = ms => new Promise(res => setTimeout(res, ms));

// // NEW - ADDED 12-28-2022 to jump to failure page
// document.querySelectorAll('.selling-timeframe-btn').forEach(item => {
//     // item.addEventListener('click', event => {
//     item.addEventListener('click', async () => {
//         console.log('JUST CLICKED SELLING TIMEFRAME!');
//         let contactInfoRequired = $("#contact-required").val();
//         console.log('We found this contactInfoRequired: ' + contactInfoRequired);
//         if (contactInfoRequired == "false" || !contactInfoRequired) {
//             console.log('Will hide the visitor info page');
//             $("#visitor-info-page").hide();
//         }

//         let failedPropertyInfo = $("#failed-property-pull").val();
//         console.log("Failed property pull from #failed-property-pull: " + failedPropertyInfo);

//         let valueEstimate = $("#value-estimate-storage").val();
//         console.log("Got valueEstimate from #value-estimate-storage: " + valueEstimate);
//         console.log("Printing here?!");

//         // TODO - set a retry counter (?)
//         if (!failedPropertyInfo && (valueEstimate === "" || valueEstimate === "$0" || valueEstimate === "$-" || typeof valueEstimate === "undefined" || !valueEstimate)) {
//             console.log('Waiting 2 secs');
//             await delay(2000);
//             failedPropertyInfo = $("#failed-property-pull").val();
//             console.log("Waited 2 secs then pulled from #failed-property-pull: " + failedPropertyInfo);
//         }

//         if (failedPropertyInfo) {
//             console.log("Should show failure page");

//             let addressSend = $("#address-storage").val();
//             console.log("Got addressSend from #address-storage: " + addressSend);
//             $("#address-failure-page").attr("value", addressSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)

//             $("#failure-page").show();
//             $('#failure-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
//             setTimeout(function () { $("#failure-loader").hide(); }, 3000);

//             // await delay(1600); // NOTE - 3/10/2023 - why was this here? to check again? NO it's because need to wait for the default interaction to finish showing the visitor info page
//             // $("#visitor-info-page").hide();
//             // console.log("Should have just hidden visitor info page");

//             // NOTE - ADDED 3/10/2023 - Send off session update to finish here because we are done
//             let sessionInfo = getCurrentSessionInfo();
//             sessionInfo["finished"] = true;
//             $("#finished").attr("value", true);
//             updateSession(sessionInfo);
//         } else if (contactInfoRequired == "false" || !contactInfoRequired) {
//             $("#success-page").show();
//             $('#success-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
//             setTimeout(function () { $("#success-loader").hide(); }, 3000);
//             $(".value-div").show();

//             // TOOK THE BELOW OUT OF submitSellerDetails()
//             $("#address-appointment").attr("value", addressSend); // for the form submission(s); potentially move down to unit submit section and send "unitAddress"
//             $("#address-virtual-appointment").attr("value", addressSend);

//             // Send off session update
//             let sessionInfo = getCurrentSessionInfo();
//             sessionInfo["finished"] = true;
//             $("#finished").attr("value", true);
//             updateSession(sessionInfo);
//         }
//     })
// });

// document.querySelectorAll('.show-report').forEach(item => {
//     item.addEventListener('click', event => {
//         $("#visitor-info-page").hide();
//         let valueEstimate = $("#value-estimate-storage").val();
//         console.log("Got valueEstimate from #value-estimate-storage: " + valueEstimate);
//         console.log("Printing here?!");

//         let addressSend = $("#address-storage").val();
//         console.log("Got addressSend from #address-storage: " + addressSend);
//         if ((valueEstimate === "" || valueEstimate === "$0" || valueEstimate === "$-" || typeof valueEstimate === "undefined" || !valueEstimate)) {
//             console.log("Should show failure page");
//             $("#failure-page").show();
//             $('#failure-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
//             setTimeout(function () { $("#failure-loader").hide(); }, 3000);
//             // $("#just-calendly").show();
//             // $('#home-animation-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
//             // setTimeout(function () { $("#home-animation-loader").hide(); }, 3000);

//             // let sessionIdSend = $("#session-id-storage").val(); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//             // $("#session-id-failure-page").attr("value", sessionIdSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)            
//             $("#address-failure-page").attr("value", addressSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//         } else {
//             $("#success-page").show();
//             $('#success-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
//             setTimeout(function () { $("#success-loader").hide(); }, 3000);
//             $(".value-div").show();

//             // TOOK THE BELOW OUT OF submitSellerDetails()
//             $("#address-appointment").attr("value", addressSend); // for the form submission(s); potentially move down to unit submit section and send "unitAddress"
//             $("#address-virtual-appointment").attr("value", addressSend);

//             // // Send off session update
//             // let sessionInfo = getCurrentSessionInfo();
//             // sessionInfo["finished"] = true;
//             // $("#finished").attr("value", true);
//             // updateSession(sessionInfo);
//         }
//         // Changed 03/28/2023 - ALWAYS send off session update
//         let sessionInfo = getCurrentSessionInfo();
//         sessionInfo["finished"] = true;
//         $("#finished").attr("value", true);
//         updateSession(sessionInfo);
//     });
// });

document.getElementById("contact-submit-btn").addEventListener('click', async (event) => {
    console.log('clicked contact submit');
    let nameInput = $("#name-input").val();
    let phoneInput = $("#phone-input").val();
    if ((nameInput == null || nameInput == "") || (phoneInput == null || phoneInput == "")) {
        console.log('They did not provide details');
        $("#fields-required-warning").show();
    } else {
        $("#visitor-info-page").hide();

        let valueEstimate = $("#value-estimate-storage").val();
        console.log("Got valueEstimate from #value-estimate-storage: " + valueEstimate);
        console.log("Printing here?!");

        let addressSend = $("#address-storage").val();
        console.log("Got addressSend from #address-storage: " + addressSend);

        if ((valueEstimate === "" || valueEstimate === "$0" || valueEstimate === "$-" || typeof valueEstimate === "undefined" || !valueEstimate)) {
            console.log("Should show failure page");
            $("#failure-page").show();
            $('#failure-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
            setTimeout(function () { $("#failure-loader").hide(); }, 3000);
            // $("#just-calendly").show();
            // $('#home-animation-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
            // setTimeout(function () { $("#home-animation-loader").hide(); }, 3000);

            // let sessionIdSend = $("#session-id-storage").val(); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
            // $("#session-id-failure-page").attr("value", sessionIdSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)            
            $("#address-failure-page").attr("value", addressSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
        } else {
            $("#success-page").show();
            $('#success-loader').css('display', 'flex'); // replacing typical "$("#success-loader").show();" ; alternative may be to always show it with 'flex' in webflow then just do the .hide() step below
            setTimeout(function () { $("#success-page-estimates").show(); }, 3000);
            setTimeout(function () { $("#success-loader").hide(); }, 3000);
            // $(".value-div").show();

        }
        // Changed 03/28/2023 - ALWAYS send off session update
        let sessionInfo = getCurrentSessionInfo();
        sessionInfo["finished"] = true;
        $("#finished").attr("value", true);
        updateSession(sessionInfo);
    }
});

// // DO THIS IS IF WANT TO SUBMIT ON SHOW REPORT
// const showReportButtons = document.querySelectorAll('.show-report');
// for (const showReportButton of showReportButtons) {
//     showReportButton.addEventListener('click', function handleClick(event) {
//         console.log('Submitting details to show report...');

//         // TOOK THE BELOW OUT OF submitSellerDetails()
//         let addressSend = $("#address-storage").val();
//         $("#address-appointment").attr("value", addressSend); // for the form submission(s); potentially move down to unit submit section and send "unitAddress"
//         $("#address-virtual-appointment").attr("value", addressSend);

//         let sessionIdSend = $("#session-id-storage").val(); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//         $("#address-failure-page").attr("value", addressSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)
//         $("#session-id-failure-page").attr("value", sessionIdSend); // NEW - ADDED 12-28-2022 to set and send with forms (e.g., request detailed report form)

//         // Send off session update
//         let sessionInfo = getCurrentSessionInfo();
//         sessionInfo["finished"] = true;
//         $("#finished").attr("value", true);
//         updateSession(sessionInfo);
//     });
// }