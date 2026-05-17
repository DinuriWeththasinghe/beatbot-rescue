let questions = [];



let currentLevel = 1;
let score = 0;
let timeLeft = 30;
let timerInterval = null;
let selectedAnswer = null;
let recoveryTimeLeft = 10;
let recoveryTimerInterval = null;
let heartSolution = null;

function goToPage(page) {
    window.location.href = page;
}
//virtual identity
async function saveUsernameAndLogin() {
    const usernameInput = document.getElementById("username");
    const username = usernameInput.value.trim();

    if (username === "") {
        alert("Please enter a username.");
        return;
    }

    localStorage.setItem("beatbotUsername", username);

    try {
        const cloudProgress = await loadProgressFromFirestore(username);

        if (cloudProgress) {
            const gameState = {
                paused: true,
                currentLevel: cloudProgress.currentLevel || 1,
                score: cloudProgress.score || 0,
                timeLeft: cloudProgress.timeLeft || 30
            };

            localStorage.setItem("beatbotPausedGame", JSON.stringify(gameState));

            const savedGameOptions = document.getElementById("savedGameOptions");
            if (savedGameOptions) {
                savedGameOptions.style.display = "block";
                return;
            }
        }
    } catch (error) {
        console.error("Login error:", error);
    }

    goToPage("game.html");
}
//VIRTUAL IDENTITY
function loadUsername() {
    const savedUsername = localStorage.getItem("beatbotUsername");
    const playerNameElement = document.getElementById("playerName");

    if (playerNameElement) {
        playerNameElement.textContent = savedUsername ? savedUsername : "Guest";
    }
}
function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}
//open trivia API-interopability
async function fetchQuestionsFromAPI(amount = 5) {
    try {
        const response = await fetch(
            `https://opentdb.com/api.php?amount=${amount}&difficulty=easy&type=multiple`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("No questions returned from API");
        }

        questions = data.results.map((item, index) => {
            const allAnswers = [
                ...item.incorrect_answers.map(answer => decodeHTML(answer)),
                decodeHTML(item.correct_answer)
            ];

            return {
                robotId: `BBR-0${index + 1}`,
                question: decodeHTML(item.question),
                answers: shuffleArray(allAnswers),
                correct: decodeHTML(item.correct_answer),
                category: decodeHTML(item.category),
                difficulty: item.difficulty
            };
        });

        console.log("Easy questions loaded from API:", questions);
    } catch (error) {
        console.error("Error fetching questions from API:", error);

        questions = [
            {
                robotId: "BBR-01",
                question: "Which planet is known as the Red Planet?",
                answers: ["Earth", "Mars", "Venus", "Jupiter"],
                correct: "Mars",
                category: "General Knowledge",
                difficulty: "easy"
            },
            {
                robotId: "BBR-02",
                question: "What does HTML stand for?",
                answers: [
                    "Hyper Text Markup Language",
                    "High Transfer Machine Language",
                    "Hyper Tool Multi Language",
                    "Home Text Machine Language"
                ],
                correct: "Hyper Text Markup Language",
                category: "Computers",
                difficulty: "easy"
            },
            {
                robotId: "BBR-03",
                question: "Which language is mainly used for web page interactivity?",
                answers: ["CSS", "JavaScript", "SQL", "C++"],
                correct: "JavaScript",
                category: "Computers",
                difficulty: "easy"
            },
            {
                robotId: "BBR-04",
                question: "What color is the sky on a clear day?",
                answers: ["Blue", "Green", "Red", "Yellow"],
                correct: "Blue",
                category: "General Knowledge",
                difficulty: "easy"
            },
            {
                robotId: "BBR-05",
                question: "How many days are there in a week?",
                answers: ["5", "6", "7", "8"],
                correct: "7",
                category: "General Knowledge",
                difficulty: "easy"
            }
        ];
    }
}

async function startGame() {
    loadUsername();
    loadGameState();

    if (questions.length === 0) {
        await fetchQuestionsFromAPI(5);
    }

    loadQuestion();
    startTimer();
}
//only load question data to the interface- high cohension
function loadQuestion() {
    const questionText = document.getElementById("questionText");
    const answerGrid = document.getElementById("answerGrid");
    const levelElement = document.getElementById("level");
    const scoreElement = document.getElementById("score");
    const timerElement = document.getElementById("timer");
    const robotIdElement = document.getElementById("robotId");
    const robotStatusElement = document.getElementById("robotStatus");
    const categoryElement = document.getElementById("questionCategory");
    const difficultyElement = document.getElementById("questionDifficulty");
    const messageBox = document.getElementById("messageBox");

    if (!questionText || !answerGrid) return;

    messageBox.textContent = "";
    selectedAnswer = null;

    const currentQuestion = questions[currentLevel - 1];

    if (!currentQuestion) {
        finishGame();
        return;
    }

    questionText.textContent = currentQuestion.question;
    levelElement.textContent = currentLevel;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    robotIdElement.textContent = currentQuestion.robotId;
    robotStatusElement.textContent = "Core unstable";

    if (categoryElement) {
    categoryElement.textContent = currentQuestion.category || "General";
    }

    if (difficultyElement) {
    difficultyElement.textContent = currentQuestion.difficulty || "medium";
    }

    answerGrid.innerHTML = "";

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.classList.add("answer-btn");
        button.textContent = answer;

        button.onclick = function () {
            selectAnswer(button, answer);
        };

        answerGrid.appendChild(button);
    });
}

function selectAnswer(buttonElement, answer) {
    const allButtons = document.querySelectorAll(".answer-btn");

    allButtons.forEach(button => {
        button.classList.remove("selected-answer");
    });

    buttonElement.classList.add("selected-answer");
    selectedAnswer = answer;
}
function submitAnswer() {
    const messageBox = document.getElementById("messageBox");

    if (!selectedAnswer) {
        messageBox.textContent = "Please select an answer first.";
        messageBox.style.color = "#facc15";
        return;
    }

    checkAnswer();
}
function checkAnswer() {
    const currentQuestion = questions[currentLevel - 1];
    const messageBox = document.getElementById("messageBox");
    const robotStatusElement = document.getElementById("robotStatus");

    clearInterval(timerInterval);

    if (selectedAnswer === currentQuestion.correct) {
        score += 10;
        robotStatusElement.textContent = "Rescued";
        messageBox.textContent = "Correct answer! Robot rescued.";
        messageBox.style.color = "#22c55e";

        setTimeout(() => {
            currentLevel++;
            timeLeft = 30;
            saveGameProgress();
            loadQuestion();
            startTimer();
        }, 1200);
    } else {
        robotStatusElement.textContent = "Critical failure";
        messageBox.textContent = "Wrong answer! Moving to recovery mode.";
        messageBox.style.color = "#ef4444";

        localStorage.setItem("beatbotRecoveryReason", "wrong");
        saveGameProgress();

        setTimeout(() => {
            goToPage("recovery.html");
        }, 1200);
    }
}
//event driven
function startTimer() {
    const timerElement = document.getElementById("timer");
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerElement) {
            timerElement.textContent = timeLeft;
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            localStorage.setItem("beatbotRecoveryReason", "timeout");
            saveGameProgress();
            goToPage("recovery.html");
        }
    }, 1000);
}
//only handle pausing and saving
async function pauseGame() {
    clearInterval(timerInterval);

    const gameState = {
        paused: true,
        currentLevel: currentLevel,
        score: score,
        timeLeft: timeLeft
    }; 

    localStorage.setItem("beatbotPausedGame", JSON.stringify(gameState));
    await saveProgressToFirestore();

    alert("Game paused. Your progress was saved.");
    goToPage("login.html");
}

function loadGameState() {
    const savedState = localStorage.getItem("beatbotPausedGame");

    if (savedState) {
        const parsedState = JSON.parse(savedState);
        currentLevel = parsedState.currentLevel || 1;
        score = parsedState.score || 0;
        timeLeft = parsedState.timeLeft || 30;

        parsedState.paused = false;
        localStorage.setItem("beatbotPausedGame", JSON.stringify(parsedState));
    } else {
        currentLevel = 1;
        score = 0;
        timeLeft = 30;
    }
}
function saveGameProgress() {
    const gameState = {
        paused: false,
        currentLevel: currentLevel,
        score: score,
        timeLeft: timeLeft
    };

    localStorage.setItem("beatbotPausedGame", JSON.stringify(gameState));
}

function startNewGame() {
    clearInterval(timerInterval);
    clearInterval(recoveryTimerInterval);
    localStorage.removeItem("beatbotPausedGame");
    localStorage.removeItem("beatbotFinalScore");
    localStorage.removeItem("beatbotFinalLevel");
    localStorage.removeItem("beatbotRecoveryReason");
    currentLevel = 1;
    score = 0;
    timeLeft = 30;
    questions = [];
    goToPage("game.html");
}

function startFreshGame() {
    localStorage.removeItem("beatbotPausedGame");
    localStorage.removeItem("beatbotFinalScore");
    localStorage.removeItem("beatbotFinalLevel");
    localStorage.removeItem("beatbotRecoveryReason");
    goToPage("game.html");
}

async function finishGame() {
    clearInterval(timerInterval);

    localStorage.setItem("beatbotFinalScore", score);
    localStorage.setItem("beatbotFinalLevel", currentLevel - 1);
    localStorage.removeItem("beatbotPausedGame");

    await saveScoreToFirestore(score, currentLevel - 1);

    goToPage("leaderboard.html");
}
//Heart game- introperability-receives JSON and base64 data, and displays the puzzle
function loadHeartPuzzle() {
    const recoveryQuestion = document.getElementById("recoveryQuestion");
    const recoveryMessageBox = document.getElementById("recoveryMessageBox");
    const heartPuzzle = document.getElementById("heartPuzzle");
    const heartAnswer = document.getElementById("heartAnswer");

    if (!recoveryQuestion || !heartPuzzle || !heartAnswer) return;

    recoveryQuestion.textContent = "Solve the Heart Game puzzle to recover the robot core.";
    recoveryMessageBox.textContent = "Loading puzzle...";
    recoveryMessageBox.style.color = "#38bdf8";
    heartAnswer.value = "";

    fetch("https://marcconrad.com/uob/heart/api.php?out=json&base64=yes")
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Heart API data:", data);

            if (!data) {
                throw new Error("Empty API response");
            }

            if (data.image) {
                heartPuzzle.src = data.image;
            } else if (data.question) {
                heartPuzzle.src = "data:image/png;base64," + data.question;
            } else {
                throw new Error("No image field found in API response");
            }

            heartSolution = String(data.solution).trim();

            recoveryMessageBox.textContent = "Puzzle loaded. Enter your answer.";
            recoveryMessageBox.style.color = "#22c55e";
        })
        .catch(error => {
            console.error("Heart API error:", error);
            recoveryMessageBox.textContent = "Failed to load recovery puzzle.";
            recoveryMessageBox.style.color = "#ef4444";
        });
}

function checkHeartAnswer() {
    const userAnswer = document.getElementById("heartAnswer").value.trim();
    const recoveryMessageBox = document.getElementById("recoveryMessageBox");

    if (userAnswer === "") {
        recoveryMessageBox.textContent = "Please enter an answer.";
        recoveryMessageBox.style.color = "#facc15";
        return;
    }

    clearInterval(recoveryTimerInterval);

    if (userAnswer == heartSolution) {
        recoveryMessageBox.textContent = "Recovery successful! Returning to the game.";
        recoveryMessageBox.style.color = "#22c55e";

        score += 3;

        const savedState = localStorage.getItem("beatbotPausedGame");
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            parsedState.score = score;
            parsedState.timeLeft = 30;
            localStorage.setItem("beatbotPausedGame", JSON.stringify(parsedState));
        }

        setTimeout(() => {
            goToPage("game.html");
        }, 1200);
    } else {
        recoveryMessageBox.textContent = "Wrong answer. Game over.";
        recoveryMessageBox.style.color = "#ef4444";

       localStorage.setItem("beatbotFinalScore", score);
       localStorage.setItem("beatbotFinalLevel", currentLevel);
       localStorage.removeItem("beatbotPausedGame");

       saveScoreToFirestore(score, currentLevel);

       setTimeout(() => {
       goToPage("leaderboard.html");
       }, 1200);
    }
}
function startRecoveryMode() {
    const recoveryReasonText = document.getElementById("recoveryReasonText");
    const recoveryMessageBox = document.getElementById("recoveryMessageBox");
    const recoveryTimer = document.getElementById("recoveryTimer");

    if (!recoveryReasonText || !recoveryTimer) return;

    const reason = localStorage.getItem("beatbotRecoveryReason");

    if (reason === "timeout") {
        recoveryReasonText.textContent = "You ran out of time. Complete the Heart Game challenge to continue.";
    } else if (reason === "wrong") {
        recoveryReasonText.textContent = "You selected the wrong answer. Complete the Heart Game challenge to continue.";
    } else {
        recoveryReasonText.textContent = "Recovery required. Complete the Heart Game challenge to continue.";
    }

    recoveryMessageBox.textContent = "";
    recoveryTimeLeft = 10;
    recoveryTimer.textContent = recoveryTimeLeft;

    loadHeartPuzzle();

    clearInterval(recoveryTimerInterval);
    recoveryTimerInterval = setInterval(() => {
        recoveryTimeLeft--;
        recoveryTimer.textContent = recoveryTimeLeft;

        if (recoveryTimeLeft <= 0) {
            clearInterval(recoveryTimerInterval);

            recoveryMessageBox.textContent = "Recovery time finished. Game over.";
            recoveryMessageBox.style.color = "#ef4444";

            localStorage.setItem("beatbotFinalScore", score);
            localStorage.setItem("beatbotFinalLevel", currentLevel);
            localStorage.removeItem("beatbotPausedGame");

            saveScoreToFirestore(score, currentLevel);

            setTimeout(() => {
            goToPage("leaderboard.html");
            }, 1200);
        }
    }, 1000);
}

async function loadLeaderboard() {
    const leaderboardData = await loadLeaderboardFromFirestore();

    const table = document.querySelector(".leaderboard-table");
    if (!table) return;

    table.innerHTML = `
        <div class="leaderboard-header">
            <span>Rank</span>
            <span>Player</span>
            <span>Score</span>
            <span>Level</span>
        </div>
    `;

    if (!leaderboardData || leaderboardData.length === 0) {
        table.innerHTML += `
            <div class="leaderboard-row">
                <span>-</span>
                <span>No data</span>
                <span>-</span>
                <span>-</span>
            </div>
        `;
        return;
    }

    leaderboardData.forEach((player, index) => {
        table.innerHTML += `
            <div class="leaderboard-row">
                <span>${index + 1}</span>
                <span>${player.username || "Player"}</span>
                <span>${player.score || 0}</span>
                <span>${player.highestLevel || 0}</span>
            </div>
        `;
    });
}
function checkSavedGame() {
    const savedGame = localStorage.getItem("beatbotPausedGame");
    const savedGameOptions = document.getElementById("savedGameOptions");

    if (savedGame && savedGameOptions) {
        savedGameOptions.style.display = "block";
    }
}
async function continueSavedGame() {
    const usernameInput = document.getElementById("username");
    const username = usernameInput ? usernameInput.value.trim() : "";

    if (username === "") {
        alert("Please enter a username.");
        return;
    }

    localStorage.setItem("beatbotUsername", username);

    try {
        const cloudProgress = await loadProgressFromFirestore(username);

        if (cloudProgress) {
            const gameState = {
                paused: true,
                currentLevel: cloudProgress.currentLevel || 1,
                score: cloudProgress.score || 0,
                timeLeft: cloudProgress.timeLeft || 30
            };

            localStorage.setItem("beatbotPausedGame", JSON.stringify(gameState));
        }
    } catch (error) {
        console.error("Continue game error:", error);
    }

    goToPage("game.html");
}

function startFreshGameFromLogin() {
    localStorage.removeItem("beatbotPausedGame");
    localStorage.removeItem("beatbotRecoveryReason");
    localStorage.removeItem("beatbotFinalScore");
    localStorage.removeItem("beatbotFinalLevel");
    questions = [];

    const usernameInput = document.getElementById("username");
    const username = usernameInput ? usernameInput.value.trim() : "";

    if (username !== "") {
        localStorage.setItem("beatbotUsername", username);
    }

    goToPage("game.html");
}
//only save progress to firestore/virtual identity
async function saveProgressToFirestore() {
    const username = localStorage.getItem("beatbotUsername");
    if (!username) return;

    try {
        await db.collection("progress").doc(username).set({
            username: username,
            currentLevel: currentLevel,
            score: score,
            timeLeft: timeLeft,
            paused: true,
            updatedAt: new Date().toISOString()
        });

        console.log("Progress saved to Firestore");
    } catch (error) {
        console.error("Error saving progress to Firestore:", error);
    }
}
//to save and load cloud data from Firestore
async function loadProgressFromFirestore(username) {
    if (!username) return null;

    try {
        const doc = await db.collection("progress").doc(username).get();

        if (doc.exists) {
            const data = doc.data();
            console.log("Loaded progress from Firestore:", data);
            return data;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error loading progress from Firestore:", error);
        return null;
    }
}

async function saveScoreToFirestore(finalScore, finalLevel) {
    const username = localStorage.getItem("beatbotUsername");
    if (!username) return;

    try {
        console.log("Saving score:", username, finalScore, finalLevel);
//virtual identity/ user name save to the firestore//
        await db.collection("leaderboard").doc(username).set({
            username: username,
            score: finalScore,
            highestLevel: finalLevel,
            updatedAt: new Date().toISOString()
        });

        console.log("Score saved to Firestore");
    } catch (error) {
        console.error("Error saving score to Firestore:", error);
    }
}
async function loadLeaderboardFromFirestore() {
    try {
        const snapshot = await db
            .collection("leaderboard")
            .orderBy("score", "desc")
            .limit(10)
            .get();

        const data = snapshot.docs.map(doc => doc.data());
        console.log("Leaderboard data loaded:", data);
        return data;
    } catch (error) {
        console.error("Error loading leaderboard from Firestore:", error);
        return [];
    }
}

//event driven-Different pages trigger different functions when loaded
window.onload = function () {
    loadUsername();

    if (window.location.pathname.includes("login.html")) {
        checkSavedGame();
    }

    if (window.location.pathname.includes("game.html")) {
        startGame();
    }

    if (window.location.pathname.includes("recovery.html")) {
        loadGameState();
        startRecoveryMode();
    }

    if (window.location.pathname.includes("leaderboard.html")) {
        loadLeaderboard();
    }
};