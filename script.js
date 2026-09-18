/* ==========================================
   J.A.R.V.I.S v2.0
   AI Personal Assistant
   ========================================== */

const STORAGE_KEYS = {
  tasks: "jarvis_tasks",
  notes: "jarvis_notes"
};

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks)) || [];
let notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes)) ||;


/* ---------- DOM ---------- */

const clock = document.getElementById("clock");
const dateElement = document.getElementById("date");
const greeting = document.getElementById("greeting");

const taskCount = document.getElementById("taskCount");
const completedCount = document.getElementById("completedCount");
const noteCount = document.getElementById("noteCount");

const taskList = document.getElementById("taskList");
const noteList = document.getElementById("noteList");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");

const noteInput = document.getElementById("noteInput");
const saveNote = document.getElementById("saveNote");

const clearCompleted = document.getElementById("clearCompleted");

const commandForm = document.getElementById("commandForm");
const commandInput = document.getElementById("commandInput");

const chatWindow = document.getElementById("chatWindow");
const voiceButton = document.getElementById("voiceButton");

const toast = document.getElementById("toast");


/* ---------- Clock ---------- */

function updateClock() {
  const now = new Date();

  clock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  dateElement.textContent = now.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const hour = now.getHours();

  if (hour < 12) {
    greeting.textContent = "Morning";
  } else if (hour < 17) {
    greeting.textContent = "Afternoon";
  } else if (hour < 21) {
    greeting.textContent = "Evening";
  } else {
    greeting.textContent = "Night";
  }
}

updateClock();
setInterval(updateClock, 1000);


/* ---------- Storage ---------- */

function saveTasks() {
  localStorage.setItem(
    STORAGE_KEYS.tasks,
    JSON.stringify(tasks)
  );
}

function saveNotes() {
  localStorage.setItem(
    STORAGE_KEYS.notes,
    JSON.stringify(notes)
  );
}


/* ---------- Toast ---------- */

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}


/* ---------- Tasks ---------- */

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty">
        No tasks yet.
      </div>
    `;
  } else {
    tasks.forEach(task => {
      const item = document.createElement("div");

      item.className =
        `task ${task.completed ? "completed" : ""}`;

      item.innerHTML = `
        <input
          class="task-check"
          type="checkbox"
          ${task.completed ? "checked" : ""}
        >

        <span class="task-text"></span>

        <button class="delete-task">
          ×
        </button>
      `;

      item.querySelector(".task-text").textContent =
        task.text;

      item.querySelector(".task-check")
        .addEventListener("change", () => {

          task.completed = !task.completed;

          saveTasks();
          renderTasks();
        });

      item.querySelector(".delete-task")
        .addEventListener("click", () => {

          tasks = tasks.filter(
            t => t.id !== task.id
          );

          saveTasks();
          renderTasks();

          showToast("Task deleted.");
        });

      taskList.appendChild(item);
    });
  }

  updateStats();
}

function addTask(text) {
  text = text.trim();

  if (!text) return false;

  tasks.unshift({
    id: Date.now(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();

  return true;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  if (addTask(taskInput.value)) {
    taskInput.value = "";
    showToast("Task added.");
  }
});

clearCompleted.addEventListener("click", () => {

  tasks = tasks.filter(
    task => !task.completed
  );

  saveTasks();
  renderTasks();

  showToast("Completed tasks cleared.");
});


/* ---------- Notes ---------- */

function renderNotes() {
  noteList.innerHTML = "";

  if (notes.length === 0) {
    noteList.innerHTML = `
      <div class="empty">
        No saved notes.
      </div>
    `;
  } else {
    notes.forEach(note => {

      const item = document.createElement("div");

      item.className = "note";

      item.innerHTML = `
        <strong></strong>
        <br>
        <span></span>
      `;

      item.querySelector("strong").textContent =
        new Date(note.createdAt).toLocaleDateString();

      item.querySelector("span").textContent =
        note.text;

      noteList.appendChild(item);
    });
  }

  noteCount.textContent = notes.length;
}

saveNote.addEventListener("click", () => {

  const text = noteInput.value.trim();

  if (!text) {
    showToast("Write something first.");
    return;
  }

  notes.unshift({
    id: Date.now(),
    text,
    createdAt: new Date().toISOString()
  });

  saveNotes();
  renderNotes();

  noteInput.value = "";

  showToast("Note saved.");
});


/* ---------- Stats ---------- */

function updateStats() {

  const active =
    tasks.filter(task => !task.completed).length;

  const completed =
    tasks.filter(task => task.completed).length;

  taskCount.textContent = active;
  completedCount.textContent = completed;
}


/* ---------- Chat ---------- */

function addMessage(text, sender = "jarvis") {

  const message = document.createElement("div");

  message.className =
    sender === "user"
      ? "message user-message"
      : "message jarvis-message";

  message.innerHTML = `
    <div class="avatar">
      ${sender === "user" ? "U" : "J"}
    </div>

    <div class="bubble"></div>
  `;

  message.querySelector(".bubble").textContent =
    text;

  chatWindow.appendChild(message);

  chatWindow.scrollTop =
    chatWindow.scrollHeight;
}


/* ---------- AI ---------- */

async function askJarvis(message) {

  addMessage(message, "user");

  const thinking = document.createElement("div");

  thinking.className =
    "message jarvis-message";

  thinking.innerHTML = `
    <div class="avatar">J</div>
    <div class="bubble">Thinking...</div>
  `;

  chatWindow.appendChild(thinking);

  chatWindow.scrollTop =
    chatWindow.scrollHeight;

  try {

    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message,
        tasks,
        notes
      })
    });

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {
      throw new Error(
        data.error || "Request failed."
      );
    }

    addMessage(data.reply);

    speak(data.reply);

  } catch (error) {

    thinking.remove();

    console.error(error);

    const message =
      "I couldn't connect to my AI system. Please check the Vercel configuration.";

    addMessage(message);

    showToast("AI connection error.");
  }
}


/* ---------- Commands ---------- */

commandForm.addEventListener("submit", event => {

  event.preventDefault();

  const message =
    commandInput.value.trim();

  if (!message) return;

  commandInput.value = "";

  askJarvis(message);
});


/* ---------- Quick Actions ---------- */

document
  .querySelectorAll(".quick-actions button")
  .forEach(button => {

    button.addEventListener("click", () => {

      const command =
        button.dataset.command;

      if (command === "Add task") {
        taskInput.focus();
        return;
      }

      askJarvis(command);
    });
  });


/* ---------- Voice Input ---------- */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();

  recognition.lang = "en-IN";

  recognition.continuous = false;

  recognition.interimResults = false;

  recognition.onstart = () => {

    voiceButton.textContent = "🔴";

    showToast("Listening...");
  };

  recognition.onend = () => {

    voiceButton.textContent = "🎙";
  };

  recognition.onerror = () => {

    voiceButton.textContent = "🎙";

    showToast("Voice input error.");
  };

  recognition.onresult = event => {

    const transcript =
      event.results[0][0].transcript;

    commandInput.value =
      transcript;

    askJarvis(transcript);
  };

  voiceButton.addEventListener(
    "click",
    () => recognition.start()
  );

} else {

  voiceButton.addEventListener(
    "click",
    () => {
      showToast(
        "Voice input is not supported here."
      );
    }
  );
}


/* ---------- Voice Output ---------- */

function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }

  speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.rate = 0.95;
  utterance.pitch = 0.9;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}


/* ---------- Init ---------- */

renderTasks();
renderNotes();

console.log(
  "J.A.R.V.I.S v2.0 initialized."
);  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty">
        No tasks yet. Add something for JARVIS to track.
      </div>
    `;
  } else {
    tasks.forEach(task => {
      const item = document.createElement("div");
      item.className = `task ${task.completed ? "completed" : ""}`;

      item.innerHTML = `
        <input
          class="task-check"
          type="checkbox"
          ${task.completed ? "checked" : ""}
          aria-label="Complete task"
        >

        <span class="task-text"></span>

        <button class="delete-task" aria-label="Delete task">
          ×
        </button>
      `;

      item.querySelector(".task-text").textContent = task.text;

      item.querySelector(".task-check").addEventListener("change", () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
      });

      item.querySelector(".delete-task").addEventListener("click", () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
        updateStats();
        showToast("Task deleted.");
      });

      taskList.appendChild(item);
    });
  }

  updateStats();
}

function addTask(text) {
  text = text.trim();

  if (!text) return false;

  tasks.unshift({
    id: Date.now(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();

  showToast("Task added.");

  return true;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  if (addTask(taskInput.value)) {
    taskInput.value = "";
    taskInput.focus();
  }
});

clearCompleted.addEventListener("click", () => {
  const before = tasks.length;

  tasks = tasks.filter(task => !task.completed);

  saveTasks();
  renderTasks();

  if (before !== tasks.length) {
    showToast("Completed tasks cleared.");
  } else {
    showToast("No completed tasks.");
  }
});


/* ---------- Notes ---------- */

function renderNotes() {
  noteList.innerHTML = "";

  if (notes.length === 0) {
    noteList.innerHTML = `
      <div class="empty">
        JARVIS has no saved notes.
      </div>
    `;
  } else {
    notes.forEach(note => {
      const item = document.createElement("div");
      item.className = "note";

      const date = new Date(note.createdAt);

      item.innerHTML = `
        <strong>${escapeHTML(date.toLocaleDateString())}</strong>
        <br>
        <span></span>
      `;

      item.querySelector("span").textContent = note.text;

      noteList.appendChild(item);
    });
  }

  noteCount.textContent = notes.length;
}

saveNote.addEventListener("click", () => {
  const text = noteInput.value.trim();

  if (!text) {
    showToast("Write something first.");
    return;
  }

  notes.unshift({
    id: Date.now(),
    text,
    createdAt: new Date().toISOString()
  });

  saveNotes();
  renderNotes();

  noteInput.value = "";

  showToast("Note saved.");
});


/* ---------- Stats ---------- */

function updateStats() {
  const active = tasks.filter(task => !task.completed).length;
  const completed = tasks.filter(task => task.completed).length;

  taskCount.textContent = active;
  completedCount.textContent = completed;
}


/* ---------- Chat ---------- */

function addMessage(text, sender = "jarvis") {
  const message = document.createElement("div");

  message.className =
    sender === "user"
      ? "message user-message"
      : "message jarvis-message";

  const avatar = sender === "user" ? "U" : "J";

  message.innerHTML = `
    <div class="avatar">${avatar}</div>
    <div class="bubble"></div>
  `;

  message.querySelector(".bubble").textContent = text;

  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


/* ---------- Command Engine ---------- */

function processCommand(rawCommand) {
  const command = rawCommand.trim();

  if (!command) return;

  addMessage(command, "user");

  const lower = command.toLowerCase();

  let response = "";

  /* Add task */

  if (
    lower.startsWith("add task") ||
    lower.startsWith("add a task") ||
    lower.startsWith("create task")
  ) {
    let taskText = command
      .replace(/^add\s+(a\s+)?task\s*/i, "")
      .replace(/^create\s+task\s*/i, "")
      .trim();

    if (!taskText) {
      response = "Certainly. What task should I add?";
    } else {
      addTask(taskText);
      response = `Done. I've added "${taskText}" to your task list.`;
    }
  }

  /* Show tasks */

  else if (
    lower.includes("show my tasks") ||
    lower === "tasks" ||
    lower.includes("my tasks") ||
    lower.includes("what are my tasks")
  ) {
    if (tasks.length === 0) {
      response = "Your task list is empty. Enjoy the peace.";
    } else {
      const activeTasks = tasks.filter(task => !task.completed);

      if (activeTasks.length === 0) {
        response = "All your tasks are completed. Excellent work.";
      } else {
        response =
          `You have ${activeTasks.length} active task` +
          `${activeTasks.length === 1 ? "" : "s"}: ` +
          activeTasks.slice(0, 5).map(task => task.text).join(", ") +
          ".";
      }
    }
  }

  /* Complete task */

  else if (
    lower.startsWith("complete ") ||
    lower.startsWith("finish ") ||
    lower.startsWith("done ")
  ) {
    const search = command
      .replace(/^complete\s+/i, "")
      .replace(/^finish\s+/i, "")
      .replace(/^done\s+/i, "")
      .trim()
      .toLowerCase();

    const task = tasks.find(t =>
      t.text.toLowerCase().includes(search)
    );

    if (task) {
      task.completed = true;
      saveTasks();
      renderTasks();

      response = `Task "${task.text}" marked as completed.`;
    } else {
      response = "I couldn't find a matching task.";
    }
  }

  /* Delete task */

  else if (
    lower.startsWith("delete task ") ||
    lower.startsWith("remove task ")
  ) {
    const search = command
      .replace(/^delete task\s+/i, "")
      .replace(/^remove task\s+/i, "")
      .trim()
      .toLowerCase();

    const task = tasks.find(t =>
      t.text.toLowerCase().includes(search)
    );

    if (task) {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();

      response = `Task "${task.text}" has been removed.`;
    } else {
      response = "I couldn't find that task.";
    }
  }

  /* Notes */

  else if (
    lower.includes("show my notes") ||
    lower === "notes"
  ) {
    if (notes.length === 0) {
      response = "You don't have any saved notes.";
    } else {
      response = `You have ${notes.length} saved note${
        notes.length === 1 ? "" : "s"
      }.`;
    }
  }

  /* Time */

  else if (
    lower.includes("what time") ||
    lower === "time"
  ) {
    response = `The current time is ${new Date().toLocaleTimeString()}.`;
  }

  /* Date */

  else if (
    lower.includes("what date") ||
    lower.includes("today's date") ||
    lower === "date"
  ) {
    response = `Today is ${new Date().toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })}.`;
  }

  /* Greeting */

  else if (
    lower.includes("hello") ||
    lower.includes("hi jarvis") ||
    lower === "hi" ||
    lower === "hey"
  ) {
    response = "Hello. All systems are operational. What would you like me to do?";
  }

  /* Help */

  else if (lower === "help" || lower.includes("what can you do")) {
    response =
      "I can manage tasks and notes, tell you the time and date, and respond to basic commands. Try: Add task Study Python.";
  }

  /* Clear completed */

  else if (lower.includes("clear completed")) {
    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();

    response = "Completed tasks have been cleared.";
  }

  /* Default */

  else {
    response =
      "I'm currently running in local mode. I understand task commands, notes, time, date and basic assistance. Real AI reasoning will be added in JARVIS v2.";
  }

  setTimeout(() => {
    addMessage(response);
    speak(response);
  }, 300);
}

commandForm.addEventListener("submit", event => {
  event.preventDefault();

  const command = commandInput.value;

  if (!command.trim()) return;

  commandInput.value = "";
  processCommand(command);
});


/* ---------- Quick Commands ---------- */

document.querySelectorAll(".quick-actions button").forEach(button => {
  button.addEventListener("click", () => {
    const command = button.dataset.command;

    if (command === "Add task") {
      taskInput.focus();
      return;
    }

    processCommand(command);
  });
});


/* ---------- Voice ---------- */

let recognition = null;

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    voiceButton.textContent = "🔴";
    showToast("Listening...");
  };

  recognition.onend = () => {
    voiceButton.textContent = "🎙";
  };

  recognition.onerror = () => {
    voiceButton.textContent = "🎙";
    showToast("Voice input unavailable.");
  };

  recognition.onresult = event => {
    const transcript =
      event.results[0][0].transcript;

    commandInput.value = transcript;
    processCommand(transcript);
  };

  voiceButton.addEventListener("click", () => {
    recognition.start();
  });

} else {
  voiceButton.addEventListener("click", () => {
    showToast("Voice input is not supported by this browser.");
  });
}


/* ---------- Text To Speech ---------- */

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 0.95;
  utterance.pitch = 0.9;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}


/* ---------- Security ---------- */

function escapeHTML(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ---------- Initial Render ---------- */

renderTasks();
renderNotes();

console.log("J.A.R.V.I.S v1.0 initialized.");
