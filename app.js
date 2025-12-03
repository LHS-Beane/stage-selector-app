//--------------------------------------
// Lists
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
// Load State
//--------------------------------------
let state = JSON.parse(localStorage.getItem("ssbuState")) || {
    teams: {
        home: { name: "Home", stocks: 12 },
        away: { name: "Away", stocks: 12 }
    },
    stagePhase: "starters",
    gamePhase: "striking",
    strikeTurn: 1,
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

function save() {
    localStorage.setItem("ssbuState", JSON.stringify(state));
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

//--------------------------------------
// SHOW SCREEN
//--------------------------------------
function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hide"));
    document.getElementById(id).classList.remove("hide");
}

//--------------------------------------
// STAGE SELECTOR SECTION
//--------------------------------------
function renderStageSelect() {
    const stageContainer = document.getElementById("stageContainer");
    const phaseDisplay = document.getElementById("phaseDisplay");
    const clickDisplay = document.getElementById("clickDisplay");

    let strikeSteps = ["P1 Strike", "P2 Strike", "P2 Strike", "P1 Final Strike"];

    phaseDisplay.textContent = "Starter Striking (1–2–1)";
    clickDisplay.textContent = "Current Action: " + strikeSteps[state.strikeTurn - 1];

    stageContainer.innerHTML = "";

    STARTERS.forEach(stage => {
        const div = document.createElement("div");
        div.textContent = stage;
        div.classList.add("stage");

        if (state.banned.includes(stage)) div.classList.add("banned");
        if (state.selectedStage === stage) div.classList.add("selected");

        div.onclick = () => handleStrike(stage);

        stageContainer.appendChild(div);
    });

    save();
}

function handleStrike(stage) {
    // Prevent clicking previously banned or selected
    if (state.banned.includes(stage) || state.selectedStage) return;

    state.banned.push(stage);

    if (state.strikeTurn < 4) {
        state.strikeTurn++;
    } else {
        // Last strike → auto pick remaining
        const remaining = STARTERS.find(s => !state.banned.includes(s));
        state.selectedStage = remaining;
        state.gamePhase = "selected";
    }

    renderStageSelect();
    save();
}

// Continue to stock tracking
document.getElementById("goToStocks").onclick = () => {
    show("stockTracker");
    updateStockUI();
};

//--------------------------------------
// STOCK TRACKING LOGIC
//--------------------------------------
function updateStockUI() {
    document.getElementById("homeTeamLabel").textContent = state.teams.home.name;
    document.getElementById("awayTeamLabel").textContent = state.teams.away.name;

    document.getElementById("homePlayerStocks").textContent = state.crew.currentHomeStocks;
    document.getElementById("awayPlayerStocks").textContent = state.crew.currentAwayStocks;

    document.getElementById("homeTeamStocks").textContent = state.crew.homeStocks;
    document.getElementById("awayTeamStocks").textContent = state.crew.awayStocks;

    document.getElementById("roundHeader").textContent =
        `Round ${state.crew.roundNumber} – Stage: ${state.selectedStage}`;
}

function loseStock(team) {
    if (team === "home") {
        state.crew.currentHomeStocks--;
        state.crew.homeStocks--;

        if (state.crew.currentHomeStocks <= 0) {
            state.crew.currentHomeStocks = 3; // next player enters
        }
    } else {
        state.crew.currentAwayStocks--;
        state.crew.awayStocks--;

        if (state.crew.currentAwayStocks <= 0) {
            state.crew.currentAwayStocks = 3;
        }
    }

    // Check end of round
    if (state.crew.homeStocks <= 0 || state.crew.awayStocks <= 0) {
        const winner = state.crew.homeStocks > 0 ? state.teams.home.name : state.teams.away.name;
        alert("Round Over! Winner: " + winner);
        state.crew.roundNumber++;
        state.crew.homeStocks = 12;
        state.crew.awayStocks = 12;
    }

    save();
    updateStockUI();
}

//--------------------------------------
// RESET
//--------------------------------------
document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem("ssbuState");
    location.reload();
};
