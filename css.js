const STORAGE_KEY = "sorteo-equipos-config";

const setupScreen = document.getElementById("setupScreen");
const resultsScreen = document.getElementById("resultsScreen");
const participantsInput = document.getElementById("participantsInput");
const participantCounter = document.getElementById("participantCounter");
const amountSelect = document.getElementById("amountSelect");
const amountButton = document.getElementById("amountButton");
const amountList = document.getElementById("amountList");
const titleInput = document.getElementById("titleInput");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const backBtn = document.getElementById("backBtn");
const teamsBoard = document.getElementById("teamsBoard");
const resultTitle = document.getElementById("resultTitle");
const resultSummary = document.getElementById("resultSummary");
const downloadBtn = document.getElementById("downloadBtn");
const copyClipboardBtn = document.getElementById("copyClipboardBtn");
const copyColumnsBtn = document.getElementById("copyColumnsBtn");
const toast = document.getElementById("toast");

let currentTeams = [];

function getSplitMode() {
  return document.querySelector("input[name='splitMode']:checked").value;
}

function getParticipants() {
  return participantsInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((rawName) => {
      const isLeader = rawName.startsWith("*");
      const name = isLeader ? rawName.slice(1).trim() : rawName;
      return { name, isLeader };
    });
}

function saveData() {
  const data = {
    participants: participantsInput.value,
    title: titleInput.value,
    splitMode: getSplitMode(),
    amount: getAmount()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    participantsInput.value = data.participants || "";
    titleInput.value = data.title || "";

    const modeInput = document.querySelector(`input[name='splitMode'][value='${data.splitMode || "teams"}']`);
    if (modeInput) modeInput.checked = true;

    if (data.amount) amountSelect.dataset.value = Number(data.amount);
    buildAmountOptions();
    updateCounter();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateCounter() {
  const total = getParticipants().length;
  participantCounter.textContent = total;
  participantCounter.style.background = total > 100 ? "#ffe8e8" : "";
  participantCounter.style.color = total > 100 ? "#b42318" : "";
}

function buildAmountOptions() {
  const mode = getSplitMode();
  const currentValue = getAmount() || 2;
  const max = mode === "teams" ? 50 : 100;
  const nextValue = Math.min(currentValue, max);

  amountList.innerHTML = "";

  for (let i = 2; i <= max; i++) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "select-option";
    option.dataset.value = i;
    option.textContent = getAmountLabel(i);
    option.setAttribute("role", "option");

    if (i === nextValue) {
      option.classList.add("active");
      option.setAttribute("aria-selected", "true");
    }

    option.addEventListener("click", () => {
      setAmount(i);
      closeAmountMenu();
      saveData();
    });

    amountList.appendChild(option);
  }

  setAmount(nextValue);
}

function getAmount() {
  return Number(amountSelect.dataset.value) || 2;
}

function getAmountLabel(value) {
  return getSplitMode() === "teams" ? `${value} equipos` : `${value} participantes por equipo`;
}

function setAmount(value) {
  amountSelect.dataset.value = value;
  amountButton.textContent = getAmountLabel(value);

  amountList.querySelectorAll(".select-option").forEach((option) => {
    const isActive = Number(option.dataset.value) === value;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", String(isActive));
  });
}

function toggleAmountMenu() {
  const isOpen = !amountList.classList.contains("hidden");
  amountList.classList.toggle("hidden", isOpen);
  amountSelect.classList.toggle("open", !isOpen);
  amountButton.setAttribute("aria-expanded", String(!isOpen));
}

function closeAmountMenu() {
  amountList.classList.add("hidden");
  amountSelect.classList.remove("open");
  amountButton.setAttribute("aria-expanded", "false");
}

function validateParticipants(participants) {
  const amount = getAmount();

  if (participants.length < 2) {
    return "Ingresa al menos 2 participantes.";
  }

  if (participants.length > 100) {
    return "Solo se permite un maximo de 100 participantes.";
  }

  const tooLong = participants.find((participant) => participant.name.length > 50);
  if (tooLong) {
    return `El nombre "${tooLong.name}" supera los 50 caracteres.`;
  }

  const emptyName = participants.find((participant) => participant.name.length === 0);
  if (emptyName) {
    return "Los lideres deben tener un nombre despues del asterisco.";
  }

  if (getSplitMode() === "teams" && amount > participants.length) {
    return "La cantidad de equipos no puede superar la cantidad de participantes.";
  }

  return "";
}

function shuffle(list) {
  const copy = [...list];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function createTeams(participants) {
  const mode = getSplitMode();
  const amount = getAmount();
  const totalTeams = mode === "teams" ? amount : Math.ceil(participants.length / amount);
  const teams = Array.from({ length: totalTeams }, (_, index) => ({
    name: `Equipo ${index + 1}`,
    members: []
  }));

  const leaders = shuffle(participants.filter((participant) => participant.isLeader));
  const regulars = shuffle(participants.filter((participant) => !participant.isLeader));

  leaders.forEach((leader, index) => {
    teams[index % totalTeams].members.push(leader);
  });

  regulars.forEach((participant) => {
    const [teamWithSpace] = [...teams].sort((a, b) => a.members.length - b.members.length);
    teamWithSpace.members.push(participant);
  });

  return teams;
}

function renderTeams(teams) {
  teamsBoard.innerHTML = "";

  teams.forEach((team, teamIndex) => {
    const card = document.createElement("article");
    card.className = "team-card";

    const title = document.createElement("div");
    title.className = "team-title";
    title.textContent = team.name;

    const list = document.createElement("div");
    list.className = "member-list";

    team.members.forEach((member, memberIndex) => {
      const item = document.createElement("div");
      item.className = member.isLeader ? "member leader" : "member";
      item.style.animationDelay = `${(teamIndex * 120) + (memberIndex * 90)}ms`;
      item.innerHTML = `<b>${memberIndex + 1}</b><span>${escapeHtml(member.name)}</span>`;
      list.appendChild(item);
    });

    card.append(title, list);
    teamsBoard.appendChild(card);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function generateTeams() {
  const participants = getParticipants();
  const error = validateParticipants(participants);

  if (error) {
    showToast(error);
    return;
  }

  currentTeams = createTeams(participants);
  const title = titleInput.value.trim() || "Equipos generados";

  resultTitle.textContent = title;
  resultSummary.textContent = `${participants.length} participantes distribuidos en ${currentTeams.length} equipos.`;
  renderTeams(currentTeams);

  setupScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");
  saveData();
}

function formatTeamsAsText() {
  const title = resultTitle.textContent;
  const lines = [title, ""];

  currentTeams.forEach((team) => {
    lines.push(team.name);
    team.members.forEach((member, index) => {
      lines.push(`${index + 1}. ${member.name}${member.isLeader ? " (Lider)" : ""}`);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}

function formatTeamsAsColumns() {
  const maxRows = Math.max(...currentTeams.map((team) => team.members.length));
  const rows = [currentTeams.map((team) => team.name).join("\t")];

  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    rows.push(currentTeams.map((team) => {
      const member = team.members[rowIndex];
      return member ? member.name : "";
    }).join("\t"));
  }

  return rows.join("\n");
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    showToast(message);
  }
}

function downloadJpg() {
  if (!currentTeams.length) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 1200;
  const cardWidth = 340;
  const gap = 24;
  const columns = Math.min(3, currentTeams.length);
  const rows = Math.ceil(currentTeams.length / columns);
  const rowHeights = [];

  for (let row = 0; row < rows; row++) {
    const rowTeams = currentTeams.slice(row * columns, row * columns + columns);
    const maxMembers = Math.max(...rowTeams.map((team) => team.members.length));
    rowHeights.push(86 + maxMembers * 40);
  }

  canvas.width = width;
  canvas.height = 160 + rowHeights.reduce((sum, height) => sum + height + gap, 0);

  ctx.fillStyle = "#f4f6fb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f2633";
  ctx.font = "700 34px Segoe UI, sans-serif";
  ctx.fillText(resultTitle.textContent, 48, 62);
  ctx.font = "18px Segoe UI, sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText(resultSummary.textContent, 48, 96);

  let y = 132;
  currentTeams.forEach((team, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 48 + column * (cardWidth + gap);

    if (column === 0 && index > 0) {
      y += rowHeights[row - 1] + gap;
    }

    const height = 70 + team.members.length * 40;
    drawCard(ctx, x, y, cardWidth, height, team);
  });

  const link = document.createElement("a");
  link.download = "equipos-generados.jpg";
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
  showToast("JPG descargado.");
}

function drawCard(ctx, x, y, width, height, team) {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#dde3ef";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff0fa";
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, width - 2, 46, [8, 8, 0, 0]);
  ctx.fill();

  ctx.fillStyle = "#df1aa0";
  ctx.font = "700 20px Segoe UI, sans-serif";
  ctx.fillText(team.name, x + 18, y + 31);

  ctx.font = "16px Segoe UI, sans-serif";
  team.members.forEach((member, index) => {
    const itemY = y + 72 + index * 40;
    ctx.fillStyle = "#1f2633";
    ctx.fillText(`${index + 1}. ${member.name}`, x + 18, itemY);

    if (member.isLeader) {
      ctx.fillStyle = "#df1aa0";
      ctx.fillText("Lider", x + width - 70, itemY);
    }
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

participantsInput.addEventListener("input", () => {
  updateCounter();
  saveData();
});

titleInput.addEventListener("input", saveData);
amountButton.addEventListener("click", toggleAmountMenu);
generateBtn.addEventListener("click", generateTeams);
clearBtn.addEventListener("click", () => {
  participantsInput.value = "";
  titleInput.value = "";
  updateCounter();
  saveData();
});

backBtn.addEventListener("click", () => {
  resultsScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
});

downloadBtn.addEventListener("click", downloadJpg);
copyClipboardBtn.addEventListener("click", () => copyText(formatTeamsAsText(), "Resultado copiado."));
copyColumnsBtn.addEventListener("click", () => copyText(formatTeamsAsColumns(), "Columnas copiadas."));

document.querySelectorAll("input[name='splitMode']").forEach((input) => {
  input.addEventListener("change", () => {
    buildAmountOptions();
    saveData();
  });
});

document.addEventListener("click", (event) => {
  if (!amountSelect.contains(event.target)) {
    closeAmountMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAmountMenu();
  }
});

buildAmountOptions();
loadData();
updateCounter();
