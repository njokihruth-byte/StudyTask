const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskSubject = document.getElementById("taskSubject");
const taskDate = document.getElementById("taskDate");
const taskFilter = document.getElementById("taskFilter");
const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const taskSearch = document.getElementById("taskSearch");
const darkModeButton = document.getElementById("darkModeButton");

let tasks = [];

try {
  const savedTasks = localStorage.getItem("studyTaskTasks");
  tasks = savedTasks ? JSON.parse(savedTasks) : [];

  if (!Array.isArray(tasks)) {
    tasks = [];
  }
} catch {
  tasks = [];
}

function saveTasks() {
  try {
    localStorage.setItem("studyTaskTasks", JSON.stringify(tasks));
  } catch {
    taskMessage.textContent =
      "Unable to save tasks. Check your browser storage settings.";
  }
}

function updateStats() {
  totalTasks.textContent = tasks.length;
  pendingTasks.textContent =
    tasks.filter(task => !task.completed).length;
  completedTasks.textContent =
    tasks.filter(task => task.completed).length;
}

function renderTasks() {
  taskList.replaceChildren();

  const filter = taskFilter.value;
  const search = taskSearch.value.trim().toLowerCase();

  const filteredTasks = tasks.filter(task => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !task.completed) ||
      (filter === "completed" && task.completed);

    const matchesSearch =
      task.title.toLowerCase().includes(search) ||
      task.subject.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  if (filteredTasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-message";
    emptyItem.textContent = tasks.length === 0
      ? "No tasks yet. Add your first task above!"
      : "No matching tasks found.";

    taskList.appendChild(emptyItem);
  }

  // Get today's date in local time.
  const now = new Date();
  const today =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  filteredTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item";

    const isOverdue =
      !task.completed && task.dueDate < today;

    if (isOverdue) {
      item.classList.add("overdue");
    }

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("h3");
    title.textContent = task.title;

    if (task.completed) {
      title.classList.add("done-title");
    }

    const subject = document.createElement("p");
    subject.textContent = "Subject: " + task.subject;

    const dueDate = document.createElement("p");
    dueDate.textContent = "Due: " + task.dueDate;

    const status = document.createElement("p");

    if (task.completed) {
      status.textContent = "Completed";
    } else if (isOverdue) {
      status.textContent = "OVERDUE — Please complete this task";
      status.classList.add("overdue-warning");
    } else {
      status.textContent = "Pending";
    }

    info.append(title, subject, dueDate, status);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.className = "complete-button";
    completeButton.dataset.action = "toggle";
    completeButton.dataset.id = task.id;
    completeButton.textContent =
      task.completed ? "Undo" : "Complete";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = task.id;
    deleteButton.textContent = "Delete";

    actions.append(completeButton, deleteButton);
    item.append(info, actions);
    taskList.appendChild(item);
  });

  updateStats();
}

taskForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const title = taskTitle.value.trim();
  const subject = taskSubject.value.trim();
  const dueDate = taskDate.value;

  if (!title || !subject || !dueDate) {
    taskMessage.textContent = "Please fill in all fields.";
    return;
  }

  const newTask = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    title: title,
    subject: subject,
    dueDate: dueDate,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();

  taskForm.reset();
  taskMessage.textContent = "Task added successfully!";
  taskFilter.value = "all";

  renderTasks();
});

taskList.addEventListener("click", function(event) {
  const button = event.target.closest("button[data-action]");

  if (!button || !taskList.contains(button)) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "toggle") {
    tasks = tasks.map(task =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    );

    taskMessage.textContent = "Task status updated.";
  } else if (action === "delete") {
    tasks = tasks.filter(task => task.id !== id);
    taskMessage.textContent = "Task deleted.";
  } else {
    return;
  }

  saveTasks();
  renderTasks();
});

taskFilter.addEventListener("input", renderTasks);
renderTasks();

function applyTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);

  darkModeButton.textContent = isDark
    ? "☀️ Light mode"
    : "🌙 Dark mode";

  darkModeButton.setAttribute("aria-pressed", String(isDark));

  document.documentElement.style.colorScheme =
    isDark ? "dark" : "light";
}

let isDarkMode = localStorage.getItem("studyTaskTheme") === "dark";

applyTheme(isDarkMode);

darkModeButton.addEventListener("click", function() {
  isDarkMode = !isDarkMode;

  try {
    localStorage.setItem(
      "studyTaskTheme",
      isDarkMode ? "dark" : "light"
    );
  } catch {
    // The theme still changes for the current page.
  }

  applyTheme(isDarkMode);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch(error => {
        console.error("Service worker registration failed:", error);
      });
  });
}