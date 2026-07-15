const API = window.location.origin;

/* 🔄 ROUTING */
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("cozy_user");
  const path = window.location.pathname;

  if (!user && !path.includes("login.html")) {
    window.location.href = "login.html";
  } else if (user && path.includes("login.html")) {
    window.location.href = "index.html";
  } else if (user) {
    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) welcomeMsg.textContent = `hi, ${user} ☕`;
    if (document.getElementById("taskList")) loadTasks();
  }
});

/* 🔐 LOGIN + SIGNUP */
async function handleAuth(type) {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return alert("Fill all fields ☕");

  const res = await fetch(`${API}/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("cozy_user", username);
    window.location.href = "index.html";
  } else {
    alert(data.error || "Something went wrong ☕");
  }
}

/* ➕ ADD TASK */
async function addTask() {
  const task = document.getElementById("taskInput").value.trim();
  const deadline = document.getElementById("deadlineInput").value;
  const username = localStorage.getItem("cozy_user");
  if (!task) return;

  await fetch(`${API}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, deadline, username })
  });

  document.getElementById("taskInput").value = "";
  document.getElementById("deadlineInput").value = "";
  loadTasks();
}

/* ✅ COMPLETE TASK */
async function completeTask(id) {
  await fetch(`${API}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  loadTasks();
}

/* ❌ DELETE TASK */
async function deleteTask(id) {
  await fetch(`${API}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  loadTasks();
}

/* 📜 TOGGLE HISTORY */
function toggleHistory() {
  const section = document.getElementById("historySection");
  section.classList.toggle("show");
}

/* ☕ COFFEE LEVEL based on deadline urgency */
function getCoffeeLevel(deadline) {
  if (!deadline) return "low";
  const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff <= 1) return "full";
  if (diff <= 3) return "half";
  return "low";
}

/* 📋 LOAD TASKS */
async function loadTasks() {
  const username = localStorage.getItem("cozy_user");
  const res = await fetch(`${API}/tasks?username=${username}`);
  const data = await res.json();

  const list = document.getElementById("taskList");
  const history = document.getElementById("historyList");

  list.innerHTML = "";
  history.innerHTML = "";

  /* toggle scrollable height — only when real tasks exist */
  const taskSection = document.querySelector(".task-section");
  const historySection = document.getElementById("historySection");

  if (data.active.length > 0) {
    taskSection.classList.add("has-tasks");
  } else {
    taskSection.classList.remove("has-tasks");
  }

  if (data.completed.length > 0) {
    historySection.classList.add("has-items");
  } else {
    historySection.classList.remove("has-items");
  }

  /* ACTIVE TASKS */
  if (data.active.length === 0) {
    list.innerHTML = `<li class="empty-msg">no tasks yet — time to relax ☕</li>`;
  }

  data.active.forEach(t => {
    const level = getCoffeeLevel(t.deadline);
    const deadlineText = t.deadline ? t.deadline : "no deadline";

    const li = document.createElement("li");
    li.innerHTML = `
      <label class="cb-wrap">
        <input type="checkbox" onchange="completeTask('${t.id}')">
        <span class="cb-box"></span>
      </label>
      <div class="task-content">
        <span class="task-name">${t.task}</span>
        <span class="task-date">📅 ${deadlineText}</span>
      </div>
      <div class="coffee" title="Priority: ${level}">
        <div class="coffee-fill ${level}"></div>
      </div>
      <button class="delete-btn" onclick="deleteTask('${t.id}')" title="Delete">✖</button>
    `;
    list.appendChild(li);
  });

  /* COMPLETED TASKS */
  if (data.completed.length === 0) {
    history.innerHTML = `<div class="empty-msg">no finished brews yet ☕</div>`;
  }

  data.completed.forEach(t => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <span class="history-check">✔</span>
      <span class="history-task">${t.task}</span>
      <button class="delete-btn" onclick="deleteTask('${t.id}')" title="Remove">✖</button>
    `;
    history.appendChild(div);
  });
}

/* 🚪 LOGOUT */
function logout() {
  localStorage.removeItem("cozy_user");
  window.location.href = "login.html";
}

/* 🌍 GLOBAL */
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.toggleHistory = toggleHistory;
window.logout = logout;
window.handleAuth = handleAuth;
