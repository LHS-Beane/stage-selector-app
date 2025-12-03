// -----------------------------
// Stage Lists (Esports Ohio)
// -----------------------------
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

// -----------------------------
// Restore persistent state
// -----------------------------
let state = JSON.parse(localStorage.getItem("stageState")) || {
    phase: "starters",      // "starters" or "counterpicks"
    banned: [],
    selected: null,
};

// Save state
function save() {
    localStorage.setItem("stageState", JSON.stringify(state));
}

// -----------------------------
// Render UI
// -----------------------------
function render() {
    const container = document.getElementById("stageContainer");
    const phaseDisplay = document.getElementById("phaseDisplay");

    let stageList = state.phase === "starters" ? STARTERS : STARTERS.concat(COUNTERPICKS);

    phaseDisplay.textContent = 
        state.phase === "starters" 
            ? "Starter Striking (1–2–1)"
            : "Winner bans 3 → Loser selects";

    container.innerHTML = "";

    stageList.forEach(stage => {
        const div = document.createElement("div");
        div.textContent = stage;
        div.classList.add("stage");

        if (state.banned.includes(stage)) div.classList.add("banned");
        if (state.selected === stage) div.classList.add("selected");

        div.onclick = () => handleStageClick(stage);

        container.appendChild(div);
    });

    save();
}

function handleStageClick(stage) {
    // If already selected → do nothing
    if (state.selected) return;

    // Ban until proper number reached
    state.banned.push(stage);

    // Starter logic: once 4 strikes, pick remaining
    if (state.phase === "starters" && state.banned.length === 4) {
        const remaining = STARTERS.find(s => !state.banned.includes(s));
        state.selected = remaining;
    }

    // Counterpick logic: winner bans 3 → loser chooses any remaining
    if (state.phase === "counterpicks" && state.banned.length === 3) {
        // Now loser taps any available stage — next click selects instead of banning
        document.getElementById("phaseDisplay").textContent = "Loser picks a remaining stage";
        handleStageClick = pickStage; // rebind dynamically
    }

    render();
}

// Loser chooses a stage after winner bans
function pickStage(stage) {
    if (!state.banned.includes(stage)) {
        state.selected = stage;
        render();
    }
}

// -----------------------------
// Reset Button
// -----------------------------
document.getElementById("resetBtn").onclick = () => {
    state = {
        phase: "starters",
        banned: [],
        selected: null
    };
    save();
    render();
};

// -----------------------------
render();

