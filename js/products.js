/* North Star Bakery - products.js
   Pre-order list builder for the Products page.

   The bakery doesn't have online checkout, so customers usually email a
   pre-order. This lets them press "+ Add" next to items on the menu and build
   a list with quantities and an estimated price. The list is saved in
   localStorage so it's still there after a refresh, and the Contact page
   uses it to fill in the pre-order form.
*/

// the current list, as an array of { id, qty } objects
let preorderList = loadPreorderList();

// page elements the feature updates
const listItemsEl = document.getElementById("list-items");
const listEmptyEl = document.getElementById("list-empty");
const listTotalEl = document.getElementById("list-total");
const listCountEl = document.getElementById("list-count");
const listActionsEl = document.getElementById("list-actions");
const clearButton = document.getElementById("clear-list");

// ---------- setting up the menu ----------

// puts a "+ Add" button and a small "on your list" tag on every menu item
// that has a data-id in the HTML
function addMenuButtons() {
    const menuRows = document.querySelectorAll(".cards li[data-id]");

    menuRows.forEach(function (row) {
        const item = findMenuItem(row.dataset.id);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "add-btn";
        button.textContent = "+ Add";
        button.setAttribute("aria-label", "Add " + item.name + " to my pre-order list");
        button.addEventListener("click", function () {
            addToList(item.id);
        });

        const tag = document.createElement("span");
        tag.className = "on-list-tag";

        row.appendChild(button);
        row.appendChild(tag);
    });
}

// ---------- changing the list ----------

function findListEntry(id) {
    return preorderList.find(function (entry) {
        return entry.id === id;
    });
}

function addToList(id) {
    const entry = findListEntry(id);

    if (entry) {
        // already on the list, so add one more (up to the max)
        if (entry.qty < MAX_QTY) {
            entry.qty += 1;
        }
    } else {
        preorderList.push({ id: id, qty: 1 });
    }

    updateList();
}

// amount is 1 for the + button and -1 for the - button
function changeQty(id, amount) {
    const entry = findListEntry(id);
    if (!entry) {
        return;
    }

    entry.qty += amount;

    if (entry.qty < 1) {
        removeFromList(id);
        return;
    }
    if (entry.qty > MAX_QTY) {
        entry.qty = MAX_QTY;
    }

    updateList();
}

function removeFromList(id) {
    preorderList = preorderList.filter(function (entry) {
        return entry.id !== id;
    });
    updateList();
}

function clearList() {
    if (preorderList.length === 0) {
        return;
    }
    if (confirm("Clear everything from your pre-order list?")) {
        preorderList = [];
        updateList();
    }
}

// every change goes through here: save it, then redraw the page
function updateList() {
    savePreorderList(preorderList);
    showList();
}

// ---------- showing the list on the page ----------

function showList() {
    listItemsEl.innerHTML = "";

    preorderList.forEach(function (entry) {
        listItemsEl.appendChild(createListRow(entry));
    });

    const isEmpty = preorderList.length === 0;
    listEmptyEl.hidden = !isEmpty;
    listActionsEl.hidden = isEmpty;

    showTotal();
    updateMenuTags();
}

// builds one row of the list: name, price, - qty + buttons, line total, remove
function createListRow(entry) {
    const item = findMenuItem(entry.id);
    const row = document.createElement("li");
    row.className = "list-row";

    const info = document.createElement("div");
    info.className = "list-info";
    info.innerHTML = "<strong>" + item.name + "</strong><span>" + formatItemPrice(item) + "</span>";

    const qtyBox = document.createElement("div");
    qtyBox.className = "qty";
    qtyBox.appendChild(makeSmallButton("-", "Remove one " + item.name, function () {
        changeQty(item.id, -1);
    }));

    const qtyNumber = document.createElement("span");
    qtyNumber.className = "qty-number";
    qtyNumber.textContent = entry.qty;
    qtyBox.appendChild(qtyNumber);

    const plusButton = makeSmallButton("+", "Add one more " + item.name, function () {
        changeQty(item.id, 1);
    });
    plusButton.disabled = entry.qty >= MAX_QTY;
    qtyBox.appendChild(plusButton);

    const lineTotal = document.createElement("span");
    lineTotal.className = "line-total";
    lineTotal.textContent = formatTotal(getListTotals([entry]));

    const removeButton = makeSmallButton("Remove", "Remove " + item.name + " from the list", function () {
        removeFromList(item.id);
    });
    removeButton.className = "remove-btn";

    row.appendChild(info);
    row.appendChild(qtyBox);
    row.appendChild(lineTotal);
    row.appendChild(removeButton);
    return row;
}

// small helper so I don't repeat the same 5 lines for every button
function makeSmallButton(text, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "qty-btn";
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", onClick);
    return button;
}

function showTotal() {
    const totals = getListTotals(preorderList);

    if (totals.itemCount === 0) {
        listTotalEl.textContent = "";
        listCountEl.textContent = "";
        return;
    }

    listCountEl.textContent = "(" + totals.itemCount + (totals.itemCount === 1 ? " item)" : " items)");
    listTotalEl.textContent = "Estimated total: " + formatTotal(totals);
    if (totals.hasCustomPrice) {
        listTotalEl.textContent += " (custom cake price is confirmed by email)";
    }
}

// highlights menu items that are on the list and shows how many
function updateMenuTags() {
    const menuRows = document.querySelectorAll(".cards li[data-id]");

    menuRows.forEach(function (row) {
        const entry = findListEntry(row.dataset.id);
        const tag = row.querySelector(".on-list-tag");

        if (entry) {
            row.classList.add("on-list");
            tag.textContent = entry.qty + " on your list";
        } else {
            row.classList.remove("on-list");
            tag.textContent = "";
        }
    });
}

// ---------- start ----------

addMenuButtons();
showList(); // shows whatever was saved from last time
clearButton.addEventListener("click", clearList);
