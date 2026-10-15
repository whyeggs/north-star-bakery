/* North Star Bakery - contact.js
   1. Checks the pre-order form with JavaScript and shows a message under
      each field that needs fixing.
   2. Uses localStorage to fill in the form: the pre-order list from the
      Products page goes into Item Details, and a returning customer's name
      and email are filled in if they asked us to remember them.
*/

const form = document.getElementById("preorder-form");
const formStatus = document.getElementById("form-status");
const welcomeNote = document.getElementById("welcome-note");
const listNote = document.getElementById("list-note");
const rememberBox = document.getElementById("remember");

// the bakery's pre-order rules (from the contact page and hours)
const pickupRules = {
    noticeDays: 2,     // "Please give us at least 2 days for pre-orders"
    maxDaysAhead: 60,  // we don't take orders more than about 2 months out
    closedDay: 1       // getDay() number for Monday
};

// all the error messages in one place so they're easy to change
const messages = {
    nameMissing: "Please enter your name so we know who the order is for.",
    nameShort: "Your name needs at least 2 letters.",
    emailMissing: "Please enter your email. This is how we reply to you.",
    emailFormat: "That email doesn't look right. It should look like name@example.com.",
    typeMissing: "Please choose Pre-order or General Question.",
    dateMissing: "Please pick a pickup date for your pre-order.",
    dateTooSoon: "Pre-orders need at least 2 days' notice. The earliest pickup is ",
    dateTooFar: "We only take pre-orders up to 60 days ahead. Please pick an earlier date.",
    dateMonday: "We're closed on Mondays. Please pick a different day.",
    itemsMissing: "Please tell us what you'd like to order or ask about.",
    itemsShort: "Please add a little more detail (at least 10 characters).",
    allergyLong: "Allergy notes can be up to 300 characters. You have "
};

// one check function for each field. each returns an error message,
// or an empty string "" if the field is fine
const validators = {
    name: checkName,
    email: checkEmail,
    type: checkType,
    date: checkDate,
    items: checkItems,
    allergy: checkAllergy
};

// ---------- the checks ----------

function getValue(id) {
    return document.getElementById(id).value.trim();
}

function checkName() {
    const name = getValue("name");
    if (name === "") {
        return messages.nameMissing;
    }
    if (name.length < 2) {
        return messages.nameShort;
    }
    return "";
}

function checkEmail() {
    const email = getValue("email");
    // something@something.something with no spaces
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (email === "") {
        return messages.emailMissing;
    }
    if (!emailPattern.test(email)) {
        return messages.emailFormat;
    }
    return "";
}

function checkType() {
    if (getValue("type") === "") {
        return messages.typeMissing;
    }
    return "";
}

function checkDate() {
    const value = getValue("date");

    // the date only matters for pre-orders, questions don't need one
    if (getValue("type") !== "preorder") {
        return "";
    }
    if (value === "") {
        return messages.dateMissing;
    }

    const pickup = parseInputDate(value);
    const earliest = getEarliestPickup();
    const latest = addDays(getToday(), pickupRules.maxDaysAhead);

    if (pickup < earliest) {
        return messages.dateTooSoon + formatDate(earliest) + ".";
    }
    if (pickup > latest) {
        return messages.dateTooFar;
    }
    if (pickup.getDay() === pickupRules.closedDay) {
        return messages.dateMonday;
    }
    return "";
}

function checkItems() {
    const items = getValue("items");
    if (items === "") {
        return messages.itemsMissing;
    }
    if (items.length < 10) {
        return messages.itemsShort;
    }
    return "";
}

function checkAllergy() {
    const length = getValue("allergy").length;
    if (length > 300) {
        return messages.allergyLong + length + ".";
    }
    return "";
}

// ---------- date helpers ----------

// today at midnight, so comparing dates doesn't depend on the time of day
function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}

// 2 days from today, skipping Monday since we're closed
function getEarliestPickup() {
    let earliest = addDays(getToday(), pickupRules.noticeDays);
    if (earliest.getDay() === pickupRules.closedDay) {
        earliest = addDays(earliest, 1);
    }
    return earliest;
}

// "Fri, Oct 16"
function formatDate(date) {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// turns the date input's "2026-10-16" into a Date in local time.
// new Date("2026-10-16") reads it as midnight UTC, which is still the day
// before in Minneapolis, so a Tuesday was coming out as a Monday.
// building it from the year, month and day numbers fixes that.
function parseInputDate(value) {
    const parts = value.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// date input values look like "2026-10-16"
function toInputValue(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

// ---------- showing and clearing errors ----------

function showError(id, message) {
    const field = document.getElementById(id);
    const errorEl = document.getElementById(id + "-error");
    errorEl.textContent = message;
    field.classList.add("invalid");
    field.setAttribute("aria-invalid", "true");
}

function clearError(id) {
    const field = document.getElementById(id);
    const errorEl = document.getElementById(id + "-error");
    errorEl.textContent = "";
    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");
}

// runs the check for one field and shows or clears its message
// returns true if the field is ok
function validateField(id) {
    const message = validators[id]();
    if (message === "") {
        clearError(id);
        return true;
    }
    showError(id, message);
    return false;
}

// checks every field and returns a list of the ids that have problems
function validateForm() {
    const badFields = [];
    Object.keys(validators).forEach(function (id) {
        if (!validateField(id)) {
            badFields.push(id);
        }
    });
    return badFields;
}

function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = "form-status " + type;
}

// ---------- submitting ----------

function handleSubmit(event) {
    // stop the form from sending until we know everything is ok
    event.preventDefault();

    const badFields = validateForm();

    if (badFields.length > 0) {
        const count = badFields.length;
        showStatus("Please fix the " + count + (count === 1 ? " field" : " fields") + " marked in red. Everything else you typed is still here.", "problem");
        // move the cursor to the first problem so it's easy to fix
        document.getElementById(badFields[0]).focus();
        return;
    }

    finishSubmit();
}

// there's no server for this class project yet, so instead of sending the
// form somewhere, it saves what it needs to and shows a confirmation
function finishSubmit() {
    const name = getValue("name");
    const email = getValue("email");
    const isPreorder = getValue("type") === "preorder";

    saveCustomer(name, email, rememberBox.checked);

    let message = "Thanks, " + name + "! We got your ";
    if (isPreorder) {
        message += "pre-order for pickup on " + formatDate(parseInputDate(getValue("date"))) + ".";
        // the list has been sent, so start fresh next time
        clearSavedPreorderList();
    } else {
        message += "question.";
    }
    message += " We'll email you at " + email + " within one business day.";

    form.reset();
    listNote.hidden = true;
    loadCustomer(false); // put the remembered name/email back in
    showStatus(message, "success");
}

// ---------- localStorage ----------

// saves the name and email only if the box is checked, otherwise forgets them
function saveCustomer(name, email, remember) {
    if (remember) {
        const customer = { name: name, email: email };
        localStorage.setItem(STORAGE_KEYS.customer, JSON.stringify(customer));
    } else {
        localStorage.removeItem(STORAGE_KEYS.customer);
    }
}

// fills in name and email if they were saved before
function loadCustomer(showWelcome) {
    const saved = localStorage.getItem(STORAGE_KEYS.customer);
    if (!saved) {
        return;
    }

    try {
        const customer = JSON.parse(saved);
        document.getElementById("name").value = customer.name;
        document.getElementById("email").value = customer.email;
        rememberBox.checked = true;

        if (showWelcome) {
            welcomeNote.textContent = "Welcome back, " + customer.name + "! We filled in your name and email from last time.";
            welcomeNote.hidden = false;
        }
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.customer);
    }
}

// puts the pre-order list from the Products page into Item Details
function loadPreorderIntoForm() {
    const list = loadPreorderList();
    const itemsBox = document.getElementById("items");

    // don't overwrite anything the customer already typed
    if (list.length === 0 || itemsBox.value.trim() !== "") {
        return;
    }

    itemsBox.value = buildListText(list);
    document.getElementById("type").value = "preorder";
    listNote.hidden = false;
}

// ---------- start ----------

// re-checks a field while the user fixes it, so the message goes away
// as soon as the problem is fixed
function watchFields() {
    Object.keys(validators).forEach(function (id) {
        const field = document.getElementById(id);

        field.addEventListener("input", function () {
            if (field.classList.contains("invalid")) {
                validateField(id);
            }
        });

        // check a field when the user leaves it, but only if they typed something
        field.addEventListener("blur", function () {
            if (field.value.trim() !== "") {
                validateField(id);
            }
        });
    });

    // changing the request type changes whether the date is needed
    document.getElementById("type").addEventListener("change", function () {
        if (document.getElementById("date").classList.contains("invalid")) {
            validateField("date");
        }
    });
}

function setDateLimits() {
    const dateInput = document.getElementById("date");
    dateInput.min = toInputValue(getEarliestPickup());
    dateInput.max = toInputValue(addDays(getToday(), pickupRules.maxDaysAhead));
}

setDateLimits();
loadCustomer(true);
loadPreorderIntoForm();
watchFields();
form.addEventListener("submit", handleSubmit);
