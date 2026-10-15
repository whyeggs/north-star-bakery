/* North Star Bakery - data.js
   Shared data and localStorage helpers.
   This file is loaded on both the Products page and the Contact page,
   so the pre-order list works the same way on both pages.
*/

// localStorage keys (kept in one object so I don't misspell them on different pages)
const STORAGE_KEYS = {
    preorderList: "northStarPreorderList",
    customer: "northStarCustomer"
};

// most of one item a customer can add to the list (bigger orders can email us)
const MAX_QTY = 24;

// every item on the Products page that can be pre-ordered
// low/high are the price range from the menu. high is null when the
// menu only says "starting at" (custom cakes are priced by email)
const menuItems = [
    { id: "sourdough",   name: "Sourdough",           low: 9,    high: 11,   unit: "per loaf" },
    { id: "seeded-rye",  name: "Seeded Rye",          low: 8,    high: 10,   unit: "per loaf" },
    { id: "baguettes",   name: "Baguettes and rolls", low: 4,    high: 12,   unit: "per order" },
    { id: "croissants",  name: "Croissants",          low: 3.75, high: 4.75, unit: "each" },
    { id: "danishes",    name: "Danishes",            low: 4,    high: 5,    unit: "each" },
    { id: "cookies",     name: "Cookies",             low: 2.5,  high: 3.5,  unit: "each" },
    { id: "layer-cake",  name: "Layer cake",          low: 36,   high: 58,   unit: "per cake" },
    { id: "cupcakes",    name: "Cupcakes (dozen)",    low: 30,   high: 42,   unit: "per dozen" },
    { id: "custom-cake", name: "Custom cake",         low: 65,   high: null, unit: "per cake" }
];

// finds the full item info (name, prices) from its id
function findMenuItem(id) {
    return menuItems.find(function (item) {
        return item.id === id;
    });
}

// ---------- pre-order list in localStorage ----------
// the list is saved as an array of objects like { id: "sourdough", qty: 2 }

function loadPreorderList() {
    const saved = localStorage.getItem(STORAGE_KEYS.preorderList);
    if (!saved) {
        return [];
    }

    // if the saved text is broken for some reason, just start over with an empty list
    try {
        const list = JSON.parse(saved);
        // only keep items that are still on the menu
        return list.filter(function (entry) {
            return findMenuItem(entry.id) && entry.qty > 0;
        });
    } catch (error) {
        return [];
    }
}

function savePreorderList(list) {
    // localStorage can only hold text, so the array gets turned into JSON first
    localStorage.setItem(STORAGE_KEYS.preorderList, JSON.stringify(list));
}

function clearSavedPreorderList() {
    localStorage.removeItem(STORAGE_KEYS.preorderList);
}

// ---------- price helpers ----------

// 9 -> "$9", 3.75 -> "$3.75"
function formatPrice(amount) {
    if (Number.isInteger(amount)) {
        return "$" + amount;
    }
    return "$" + amount.toFixed(2);
}

// price range text for one item, like "$9-$11 per loaf" or "from $65 per cake"
function formatItemPrice(item) {
    if (item.high === null) {
        return "from " + formatPrice(item.low) + " " + item.unit;
    }
    return formatPrice(item.low) + "-" + formatPrice(item.high) + " " + item.unit;
}

// adds up the low and high estimate for the whole list
function getListTotals(list) {
    const totals = { low: 0, high: 0, itemCount: 0, hasCustomPrice: false };

    list.forEach(function (entry) {
        const item = findMenuItem(entry.id);
        totals.low += item.low * entry.qty;
        totals.itemCount += entry.qty;

        if (item.high === null) {
            // no top price, so count the starting price and flag it
            totals.high += item.low * entry.qty;
            totals.hasCustomPrice = true;
        } else {
            totals.high += item.high * entry.qty;
        }
    });

    return totals;
}

// "$40.50-$52.50", with a + on the end if a custom cake makes the top price unknown
function formatTotal(totals) {
    let text = formatPrice(totals.low) + "-" + formatPrice(totals.high);
    if (totals.hasCustomPrice) {
        text += "+";
    }
    return text;
}

// turns the list into plain text for the contact form's Item Details box
function buildListText(list) {
    const lines = list.map(function (entry) {
        const item = findMenuItem(entry.id);
        return entry.qty + " x " + item.name;
    });

    lines.push("Estimated total: " + formatTotal(getListTotals(list)));
    return lines.join("\n");
}
