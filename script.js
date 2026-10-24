function sendMessage() {
    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");

    const userText = input.value.trim();

    if (userText === "") {
        return;
    }

    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.textContent = userText;

    chatBox.appendChild(userMessage);
    input.value = "";

    setTimeout(() => {
        const botMessage = document.createElement("div");
        botMessage.className = "message bot";

        const lowerText = userText.toLowerCase();

        if (/^(hi|hello|hey|hii|hlo|hola|hey there|hi there)$/i.test(userText.trim())) {
            botMessage.innerHTML = "<strong>👋 Hello!</strong><br><br>What can I do for you?";
        } else {
            botMessage.innerHTML = generateRoutine(userText);
        }

        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);
}

function normalizeDuration(value, unit) {
    const lowerUnit = unit.toLowerCase();

    if (lowerUnit.startsWith("min")) {
        return value / 60;
    }

    return value;
}

function formatTime(hoursFloat) {
    const totalMinutes = Math.round(hoursFloat * 60);
    let hour = Math.floor(totalMinutes / 60) % 24;
    let minutes = totalMinutes % 60;

    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function parseClockTime(value, period) {
    const hour = Number(value);
    const minutes = Number(period && period.includes(":") ? 0 : 0);

    if (period === "pm") {
        return (hour === 12 ? 12 : hour + 12) + minutes / 60;
    }

    if (period === "am") {
        return (hour === 12 ? 0 : hour) + minutes / 60;
    }

    return hour + minutes / 60;
}

function getTimeValueFromText(text, match) {
    const hour = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const period = match[3] ? match[3].toLowerCase() : null;

    if (period === "pm") {
        return (hour === 12 ? 12 : hour + 12) + minutes / 60;
    }

    if (period === "am") {
        return (hour === 12 ? 0 : hour) + minutes / 60;
    }

    if (hour >= 1 && hour <= 23) {
        if (/(evening|night|pm)/i.test(text)) {
            return (hour === 12 ? 12 : hour + 12) + minutes / 60;
        }
        return hour + minutes / 60;
    }

    return 9;
}

function getStartTimeFromText(text) {
    const lowerText = text.toLowerCase();

    const timePatterns = [
        /(?:from|starting|beginning|at|by|since)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
        /(?:from|starting|beginning|at|by|since)\s+(\d{1,2})(?::(\d{2}))?/i,
        /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
        /\b(\d{1,2})\s*(am|pm)\b/i
    ];

    for (const pattern of timePatterns) {
        const match = lowerText.match(pattern);
        if (!match) continue;
        return getTimeValueFromText(lowerText, match);
    }

    if (/(evening|night|late night|pm)/i.test(lowerText)) {
        return 19;
    }
    if (/(afternoon|after noon)/i.test(lowerText)) {
        return 14;
    }
    if (/(morning|early morning|am)/i.test(lowerText)) {
        return 8;
    }
    if (/(noon|midday)/i.test(lowerText)) {
        return 12;
    }

    return 9;
}

function getEndTimeFromText(text) {
    const lowerText = text.toLowerCase();
    const match = lowerText.match(/(?:till|until|by|to)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

    if (!match) {
        return null;
    }

    const hour = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const period = match[3] ? match[3].toLowerCase() : null;

    if (period === "pm") {
        return (hour === 12 ? 12 : hour + 12) + minutes / 60;
    }

    if (period === "am") {
        return (hour === 12 ? 0 : hour) + minutes / 60;
    }

    return hour + minutes / 60;
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasExactKeyword(text, keyword) {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    return pattern.test(text);
}

function parseTasks(text) {
    const lowerText = text.toLowerCase();

    const taskTemplates = [
        { label: "📚 Mathematics", keywords: ["math", "mathematics", "algebra", "calculus", "geometry"], defaultDuration: 1.5 },
        { label: "⚡ Physics", keywords: ["physics", "mechanics", "electricity"], defaultDuration: 1.5 },
        { label: "🧪 Chemistry", keywords: ["chemistry", "chem", "organic chemistry", "inorganic chemistry"], defaultDuration: 1.5 },
        { label: "🧬 Biology", keywords: ["biology", "bio"], defaultDuration: 1.25 },
        { label: "💻 Programming / Coding", keywords: ["programming", "coding", "software", "developer", "web development"], defaultDuration: 1.5 },
        { label: "📝 Assignment / Homework", keywords: ["assignment", "homework", "essay", "report", "project work"], defaultDuration: 1 },
        { label: "🏋️ Exercise / Gym", keywords: ["gym", "exercise", "workout", "fitness", "running"], defaultDuration: 1 },
        { label: "📖 Reading / Revision", keywords: ["reading", "revision", "study", "notes", "review"], defaultDuration: 1 },
        { label: "🧹 Chores / Cleaning", keywords: ["clean", "chores", "washing", "laundry", "housework"], defaultDuration: 1 },
        { label: "🧠 Deep Focus Session", keywords: ["focus", "study session", "important tasks", "plan"], defaultDuration: 1.5 },
        { label: "🎨 Creativity / Design", keywords: ["design", "drawing", "creative work", "art"], defaultDuration: 1 },
        { label: "🗂️ Organization / Planning", keywords: ["organize", "planning", "schedule", "to-do list", "task planning"], defaultDuration: 0.75 }
    ];

    const foundTasks = [];

    taskTemplates.forEach((task) => {
        let bestMatchIndex = -1;
        let bestKeyword = "";

        task.keywords.forEach((keyword) => {
            const index = lowerText.search(new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i"));
            if (index !== -1 && (bestMatchIndex === -1 || index < bestMatchIndex)) {
                bestMatchIndex = index;
                bestKeyword = keyword;
            }
        });

        if (bestMatchIndex === -1) {
            return;
        }

        const nextText = lowerText.slice(bestMatchIndex + bestKeyword.length);
        const durationMatch = nextText.match(/(\d+)\s*(hour|hr|hrs|hours|minute|min|mins|minutes)/i);

        let duration = task.defaultDuration;
        if (durationMatch) {
            duration = normalizeDuration(Number(durationMatch[1]), durationMatch[2]);
        } else {
            const globalMatch = lowerText.match(/(\d+)\s*(hour|hr|hrs|hours|minute|min|mins|minutes)/i);
            if (globalMatch && foundTasks.length === 0) {
                duration = normalizeDuration(Number(globalMatch[1]), globalMatch[2]);
            }
        }

        foundTasks.push({
            label: task.label,
            duration: duration,
            order: bestMatchIndex
        });
    });

    foundTasks.sort((a, b) => a.order - b.order);

    return foundTasks;
}

function generateRoutine(text) {
    const tasks = parseTasks(text);
    let startTime = getStartTimeFromText(text);
    const endTime = getEndTimeFromText(text);

    if (tasks.length > 0 && endTime !== null) {
        const totalTaskDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
        const explicitStartTime = getStartTimeFromText(text);

        if (explicitStartTime === 9 && !/(from|starting|beginning|at|by|since)/i.test(text)) {
            startTime = endTime - totalTaskDuration;
        }
    }

    if (tasks.length === 0) {
        return `
            <strong>🗓️ Your Suggested Routine</strong><br><br>
            I could not find clear subjects in your message, so here is a balanced default plan:<br><br>
            🕒 ${formatTime(startTime)} - ${formatTime(startTime + 1)}<br>
            📌 Top priority task<br><br>
            🕒 ${formatTime(startTime + 1)} - ${formatTime(startTime + 2)}<br>
            📚 Focus work session<br><br>
            🕒 ${formatTime(startTime + 2)} - ${formatTime(startTime + 2.25)}<br>
            ☕ Short break<br><br>
            🕒 ${formatTime(startTime + 2.25)} - ${formatTime(startTime + 2.75)}<br>
            🍎 Snack break<br><br>
            🕒 ${formatTime(startTime + 2.75)} - ${formatTime(startTime + 3.75)}<br>
            📝 Complete one important task<br><br>
            🌙 After that:<br>
            Wind down, hydrate, and prepare for tomorrow.
        `;
    }

    let routine = "<strong>🗓️ Your Suggested Routine</strong><br><br>";
    let currentTime = startTime;
    let focusTimeTotal = 0;

    tasks.forEach((task, index) => {
        const taskEnd = currentTime + task.duration;

        routine += `
            🕒 ${formatTime(currentTime)} - ${formatTime(taskEnd)}<br>
            ${task.label}<br><br>
        `;

        currentTime = taskEnd;
        focusTimeTotal += task.duration;

        if (index < tasks.length - 1) {
            const breakLength = task.duration >= 1.5 ? 0.5 : 0.25;
            const breakEnd = currentTime + breakLength;

            routine += `
                🕒 ${formatTime(currentTime)} - ${formatTime(breakEnd)}<br>
                ☕ Short break<br><br>
            `;

            currentTime = breakEnd;

            if (focusTimeTotal >= 2) {
                const snackStart = currentTime;
                const snackEnd = snackStart + 0.5;

                routine += `
                    🕒 ${formatTime(snackStart)} - ${formatTime(snackEnd)}<br>
                    🍎 Snack break<br><br>
                `;

                currentTime = snackEnd;
                focusTimeTotal = 0;
            }
        }
    });

    routine += `
        🌙 ${formatTime(currentTime)} onward<br>
        Relax, hydrate, and prepare for tomorrow.
    `;

    return routine;
}

document.getElementById("user-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});
