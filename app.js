//--------------------------------------
// Stage Lists
//--------------------------------------
const STARTERS = [
    "Battlefield",
    "Final Destination",
    "Town & City",
    "Pokémon Stadium 2",
    "Smashville"
];

const COUNTERPICKS = [
    "Kalos Pokémon League",
    "Lylat Cruise",
    "Small Battlefield",
    "Yoshi’s Story",
    "Hollow Bastion"
];

//--------------------------------------
// State handling (LocalStorage + URL)
//--------------------------------------
const STORAGE_KEY = "ssbuState_v2";

function defaultState() {
    return {
        teams: {
            home: { name: "Home", stocks: 12 },
            away: { name: "Away", stocks: 12 }
        },
        stagePhase: "starters",     // for future expansion
        gamePhase: "striking",      // "striking" | "selected"
        strikeTurn: 1,              // 1–4 for 1-2-1 flow
        banned: [],
        selectedStage: null,
        crew: {
            roundNumber: 1,
            homeStocks: 12,
            awayStocks: 12,
            currentHomeStocks: 3,
            currentAwayStocks: 3,
            lastWinner: null
        }
    };
}

function loadStateFromUrl() {
    if (!location.hash.startsWith("#state=")) return null;
    try {
        const encoded = location.hash.slice(7);
        const json = decodeURIComponent(encoded);
        return JSON.parse(json);
    } catch (e) {
        console.warn("Failed to parse state from URL hash", e);
        return null;
    }
}

function loadStateFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn("Failed to parse state from localStorage", e);
        return null;
    }
}

let state = loadStateFromUrl() || loadStateFromStorage() || defaultState();

function save() {
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Update URL hash for sharing
    updateShareUrl();
}

// Encode full state into URL hash as JSON (URI encoded)
function updateShareUrl() {
    const encoded = encodeURIComponent(JSON.stringify(state));
    const newHash = "state=" + encoded;
    const newUrl =
        location.pathname + location.search + "#" + newHash;

    if (("#" + newHash) !== location.hash) {
        history.replaceState(null, "", newUrl);
    }

    const shareInput = document.getElementById("shareUrl");
    if (shareInput) {
        shareInput.value = window.location.href;
    }
}

//--------------------------------------
// Screen switching
//--------------------------------------
function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hide"));
    document.getElementById(id).classList.remove("hide");
}

//--------------------------------------
// TEAM SETUP
//--------------------------------------
document.getElementById("saveTeams").onclick = () => {
    state.teams.home.name = document.getElementById("homeName").value || "Home";
    state.teams.away.name = document.getElementById("awayName").value || "Away";
    save();
    show("stageSelect");
    renderStageSelect();
};

function initTeamInputs() {
    const homeInput = document.getElementById("homeName");
    const awayInput = document.getElementById("awayName");

    if (state.teams.home.name !== "Home") {
        homeInput.value = state.teams.home.name;
    }
    if (state.teams.away.name !== "Away") {
        awayInput.value = state.teams.away.name;
    }
}

//--------------------------------------
// STAGE SELECTOR (1–2–1 with final PICK)
//--------------------------------------
function updateStrikeText() {
    const phaseDisplay = document.getElementById("phaseDisplay");
    const clickDisplay = document.getElementById("clickDisplay");

    phaseDisplay.textContent = "Starter Selection – 1–2–1";

    let text;
    switch (state.strikeTurn) {
        case 1:
            text = "Step 1: Team 1 bans ONE stage.";
            break;
        case 2:
            text = "Step 2: Team 2 bans ONE stage. (First of two)";
            break;
        case 3:
            text = "Step 3: Team 2 bans ONE MORE stage. (Second of two)";
            break;
        case 4:
            text = "FINAL STEP: Team 1 PICKS the stage they want to play on (tap a remaining stage).";
            break;
        default:
            text = "Selection complete.";
    }

    if (state.selectedStage) {
        text = `Stage selected: ${state.selectedStage}`;
    }

    clickDisplay.textContent = text;
}

function renderStageSelect() {
    const stageContainer = document.getElementById("stageContainer");
    stageContainer.innerHTML = "";

    updateStrikeText();

    STARTERS.forEach(stage => {
        const div = document.createElement("div");
        div.textContent = stage;
        div.classList.add("stage");

        if (state.banned.includes(stage)) {
            div.classList.add("banned");
        }

        if (state.selectedStage === stage) {
            div.classList.add("selected");
        }

        // Highlight remaining stages on final pick step
        if (state.strikeTurn === 4 && !state.selectedStage && !state.banned.includes(stage)) {
            div.classList.add("pickable");
        }

        div.onclick = () => handleStageClick(stage);

        stageContainer.appendChild(div);
    });

    save();
}

function handleStageClick(stage) {
    // Once a stage is selected, no more changes
    if (state.selectedStage) return;

    // Steps 1–3 = bans
    if (state.strikeTurn <= 3) {
        if (!state.banned.includes(stage)) {
            state.banned.push(stage);
            state.strikeTurn++;
        }
        renderStageSelect();
        save();
        return;
    }

    // Step 4 = FINAL PICK (not a ban)
    if (state.strikeTurn === 4) {
        if (!state.banned.includes(stage)) {
            state.selectedStage = stage;
            state.gamePhase = "selected";
            renderStageSelect();
            save();
        }
    }
}

// Continue to stock tracking
document.getElementById("goToStocks").onclick = () => {
    show("stockTracker");
    updateStockUI();
};

//--------------------------------------
// STOCK TRACKING
//--------------------------------------
function updateStockUI() {
    document.getElementById("homeTeamLabel").textContent = state.teams.home.name;
    document.getElementById("awayTeamLabel").textContent = state.teams.away.name;

    document.getElementById("homePlayerStocks").textContent = state.crew.currentHomeStocks;
    document.getElementById("awayPlayerStocks").textContent = state.crew.currentAwayStocks;

    document.getElementById("homeTeamStocks").textContent = state.crew.homeStocks;
    document.getElementById("awayTeamStocks").textContent = state.crew.awayStocks;

    const stageText = state.selectedStage ? ` – Stage: ${state.selectedStage}` : "";
    document.getElementById("roundHeader").textContent =
        `Round ${state.crew.roundNumber}${stageText}`;

    save();
}

// global so buttons in HTML can call it
function loseStock(team) {
    if (team === "home") {
        if (state.crew.homeStocks <= 0) return;
        state.crew.currentHomeStocks--;
        state.crew.homeStocks--;
        if (state.crew.currentHomeStocks <= 0 && state.crew.homeStocks > 0) {
            state.crew.currentHomeStocks = 3; // next player in
        }
    } else {
        if (state.crew.awayStocks <= 0) return;
        state.crew.currentAwayStocks--;
        state.crew.awayStocks--;
        if (state.crew.currentAwayStocks <= 0 && state.crew.awayStocks > 0) {
            state.crew.currentAwayStocks = 3;
        }
    }

    // Determine round end
    if (state.crew.homeStocks <= 0 || state.crew.awayStocks <= 0) {
        const winner =
            state.crew.homeStocks > 0 ? state.teams.home.name : state.teams.away.name;
        alert("Round Over! Winner: " + winner);
        state.crew.roundNumber++;
        state.crew.homeStocks = 12;
        state.crew.awayStocks = 12;
        state.crew.currentHomeStocks = 3;
        state.crew.currentAwayStocks = 3;
        state.selectedStage = null;
        state.banned = [];
        state.gamePhase = "striking";
        state.strikeTurn = 1;
        // go back to stage select for next round
        show("stageSelect");
        renderStageSelect();
        return;
    }

    updateStockUI();
}

//--------------------------------------
// RESET
//--------------------------------------
document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    location.href = location.pathname + location.search; // clear hash too
};

//--------------------------------------
// On load: decide which screen to show
//--------------------------------------
window.addEventListener("load", () => {
    initTeamInputs();
    updateShareUrl();

    // If team names are set or strikes already started, go to stageSelect
    if (state.banned.length > 0 || state.selectedStage) {
        show("stageSelect");
        renderStageSelect();
    } else if (state.teams.home.name !== "Home" || state.teams.away.name !== "Away") {
        show("stageSelect");
        renderStageSelect();
    } else {
        show("teamSetup");
    }
});

// Expose loseStock globally
window.loseStock = loseStock;

