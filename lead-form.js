function getSingleRadioSelection(name) {
    /* GET the selected value of a single radio element */
    let checkedRadio = document.querySelector('input[name="' + name + '"]:checked');
    let checkedValue;
    if (checkedRadio != null) {
        checkedValue = checkedRadio.value;
    } else {
        // checkedValue = "None given";
        checkedValue = "";
    }
    console.log('Got this checkedValue: ' + checkedValue);
    return checkedValue;
}

function getSpecifiedRadioSelections(checkRadioNames, sessionInfo) {
    /* GET the selected values of ALL SPECIFIED radio elements */
    for (const checkRadioName of checkRadioNames) {
        console.log('Checking radio selections for ' + checkRadioName);
        let selection = getSingleRadioSelection(checkRadioName);
        sessionInfo[checkRadioName] = selection;
    }
    return sessionInfo;
}

function getGeneralSessionInfo() {
    let agentId = $("#agent-id-storage").val();
    let sessionId = $("#session-id-storage").val();
    console.log('Got this sessionId from storage: ' + sessionId);

    let sessionInfo = {
        "site": "refinancevalues.com",
        "agentId": agentId,
        "sessionId": sessionId,
        "source": "Refinance Report"
    }
    return sessionInfo;
}


function getSessionInfo() {
    let sessionInfo = getGeneralSessionInfo();

    // PULL validated address info to attempt the skiptrace in the backend
    sessionInfo['Submitted-Address'] = $("#address-storage").val();
    sessionInfo['addressSend'] = $("#address-storage").val();
    sessionInfo['validatedStreet'] = $("#street-storage").val(); // for the skiptrace if property info pull fails; we generally pull the address from the property info record so we know for sure where the value came from (not that there should be any difference)
    sessionInfo['validatedUnit'] = $("#unit-storage").val();
    sessionInfo['validatedUnitType'] = $("#unit-type-storage").val();
    sessionInfo['validatedCity'] = $("#city-storage").val();
    sessionInfo['validatedState'] = $("#state-storage").val();
    sessionInfo['validatedZip'] = $("#zip-storage").val(); // for the skiptrace if property info pull fails                
    console.log('Got seller session info before submit: ' + sessionInfo);

    let checkRadioNames = ["Relationship-to-Home", "Property-Use", "Current-Rate", "Cash-Back-or-Debt-Consolidate", "Credit-History"];
    sessionInfo = getSpecifiedRadioSelections(checkRadioNames, sessionInfo);
    console.log('Sending this sessionInfo: ' + sessionInfo);

    return sessionInfo;
}

function updateSession(sessionFields) {
    let backendPath = "https://hhvjdbhqp4.execute-api.us-east-1.amazonaws.com/prod";
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

function submitInitialContact(nameInputSelector) {
    /* Submit name and initial phone number, if available */
    let agentId = $("#agent-id-storage").val();
    let sessionId = $("#session-id-storage").val();

    // GET INITIAL CONTACT
    let submittedName = $(nameInputSelector).val();

    // Send off contact update; everything else (source, visitorType, etc.) should have already been sent
    let contactInfo = {
        "agentId": agentId,
        "sessionId": sessionId,
        "Submitted-Name": submittedName,
    };
    updateSession(contactInfo);
}

function submitFinalContact(phoneInputSelector, emailInputSelector) {
    /* And initial phone number, if available */
    let agentId = $("#agent-id-storage").val();
    let sessionId = $("#session-id-storage").val();

    // GET PHONE
    let submittedNumber = $(phoneInputSelector).val();
    let submittedEmail = $(emailInputSelector).val();

    // Send off contact update; everything else (source, visitorType, etc.) should have already been sent
    let contactInfo = {
        "agentId": agentId,
        "sessionId": sessionId,
        "Submitted-Number": submittedNumber,
        "Submitted-Email": submittedEmail,
        "finished": true,
    };
    $("#finished").attr("value", true);
    updateSession(contactInfo);
}

/* INITIAL FORM SUBMISSION */
document.querySelectorAll('input[name="Credit-History"]').forEach((elem) => {
    console.log(elem);
    elem.addEventListener("change", function (event) {
        event.preventDefault(); // prevent webflow defaults

        let sessionInfo = getSessionInfo();
        console.log('Updating seller info ... ');
        console.log(JSON.stringify(sessionInfo, null, 4));
        updateSession(sessionInfo);
    });

});

/* INITIAL SELLER CONTACT SUBMISSION */
document.getElementById("name-submit").addEventListener('click', (event) => {
    submitInitialContact("#name-input");
    // document.querySelectorAll('.estimated-savings').forEach(item => item.classList.remove("blurred"));
});

/* FINAL SELLER CONTACT SUBMISSION */
document.getElementById("contact-submit").addEventListener('click', (event) => {
    submitFinalContact("#phone-input", "#email-input");
    // document.querySelectorAll('.blurred').forEach(item => item.classList.remove("blurred")); // unblur everything  
});


/* HANDLE BOUNCE / BACK / EXIT */
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
    let backendPath = "https://hhvjdbhqp4.execute-api.us-east-1.amazonaws.com/prod";
    let finished = $("#finished").val(); // has a value if already bounced or reached report
    if (!finished) { // but if they bounce very early, this won't work. It will attempt to update the session.         
        let sessionInfo = getSessionInfo();;
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