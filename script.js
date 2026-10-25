const cols = [
  { id: "backlog", name: "Backlog", wip: null, color: "#c7a0b2" },
  { id: "todo", name: "To Do", wip: 5, color: "#df8bab" },
  { id: "progress", name: "In Progress", wip: 3, color: "#e9ad76" },
  { id: "testing", name: "Testing", wip: 2, color: "#b39ad9" },
  { id: "done", name: "Done", wip: null, color: "#83bda0" }
];

const K = "kan-eazyy-rubrica-tasks";
const U = "kan-eazyy-rubrica-users";
const S = "kan-eazyy-rubrica-session";
const E = "kan-eazyy-rubrica-evidence";
const THEME_KEY = "kan-eazyy-theme";

const $ = id => document.getElementById(id);

const day = n => {
  let d = new Date();
  d.setDate(d.getDate() + n);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const seed = [
  ["PB01", "Inicio de sesión", "Pantalla de acceso; validar campos obligatorios y flujo de demostración.", "Integrante 1", "Alta", "todo", 3, "Pendiente: probar campos vacíos y acceso."],
  ["PB02", "Registro de usuarios", "Crear cuenta de demostración y validar nombre, correo, contraseña y correo duplicado.", "Integrante 1", "Alta", "todo", 5, "Pendiente: probar registro válido e inválido."],
  ["PB03", "Creación de tareas", "Crear tarjeta con título, descripción, responsable, prioridad, etapa y fecha límite.", "Integrante 2", "Alta", "todo", 4, "Función implementada; registrar pruebas y capturas."],
  ["PB04", "Asignación de tareas", "Asignar cada tarjeta a una persona responsable.", "Integrante 2", "Media", "backlog", 6, "Selector de responsable implementado; probarlo."],
  ["PB05", "Priorización de tareas", "Clasificar tarjetas en Alta, Media o Baja y filtrar por prioridad.", "Integrante 2", "Media", "backlog", 7, "Prioridad y filtro implementados; sin orden automático."],
  ["PB06", "Visualización del tablero Kanban", "Mostrar Backlog, To Do, In Progress, Testing y Done.", "Integrante 3", "Alta", "backlog", 5, "Tablero implementado; guardar captura."],
  ["PB07", "Actualización del estado de las tareas", "Mover tarjetas entre etapas por arrastre o acción Mover.", "Integrante 3", "Alta", "backlog", 8, "Movimiento implementado; probar transiciones."],
  ["PB08", "Límites de trabajo en curso (WIP)", "Limitar To Do a 5, In Progress a 3 y Testing a 2 tarjetas.", "Integrante 3", "Alta", "backlog", 8, "Validación WIP implementada; probar límites."],
  ["PB09", "Edición de tareas", "Actualizar una tarjeta existente sin duplicarla.", "Integrante 4", "Media", "backlog", 9, "Edición implementada; comprobar persistencia."],
  ["PB10", "Eliminación de tareas", "Eliminar una tarjeta con confirmación previa.", "Integrante 4", "Media", "backlog", 10, "Eliminación implementada; probar y capturar."],
  ["PB11", "Pruebas exhaustivas del sistema", "Probar CRUD, filtros, persistencia, movimiento y errores.", "Integrante 4", "Alta", "backlog", 12, "Pendiente: registrar casos, resultado y evidencia."],
  ["PB12", "Validación del tablero Kanban y límites WIP", "Verificar columnas y rechazo al exceder WIP.", "Integrante 5", "Alta", "backlog", 12, "Pendiente: probar columna libre, al límite y llena."],
  ["PB13", "Despliegue de la aplicación digital", "Publicar y comprobar el prototipo en navegador.", "Integrante 5", "Media", "backlog", 14, "Pendiente: URL publicada y evidencia de acceso."],
  ["PB14", "Recopilación de retroalimentación", "Recoger comentarios de usuarios de prueba.", "Integrante 5", "Baja", "backlog", 16, "Pendiente: registrar comentarios y mejoras."],
  ["PB15", "Mantenimiento y mejora continua", "Priorizar mejoras a partir de errores y retroalimentación.", "Integrante 5", "Baja", "backlog", 18, "Pendiente: documentar cambios y versión."]
].map((x, i) => ({
  id: "pb" + String(i + 1).padStart(2, "0").toLowerCase(),
  code: x[0],
  title: x[1],
  description: x[2],
  assignee: x[3],
  priority: x[4],
  status: x[5],
  due: day(x[6]),
  evidence: x[7]
}));

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    toast("No se pudieron guardar los datos.");
    return false;
  }
}

let tasks = read(K, null);

if (!Array.isArray(tasks) || !tasks.length) {
  tasks = seed;
  save(K, tasks);
}

let evid = read(E, []);
let mode = "login";
let user = read(S, null);
let dragId = null;
let timer;

/* MODO OSCURO Y MODO CLARO */

function applyTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);

  const themeToggle = $("themeToggle");

  if (themeToggle) {
    themeToggle.textContent = isDark
      ? "☀️ Modo claro"
      : "🌙 Modo oscuro";

    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Activar modo claro" : "Activar modo oscuro"
    );

    themeToggle.setAttribute("aria-pressed", String(isDark));
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === "dark");

  const themeToggle = $("themeToggle");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = !document.body.classList.contains("dark-mode");

      applyTheme(isDark);

      localStorage.setItem(
        THEME_KEY,
        isDark ? "dark" : "light"
      );
    });
  }
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(timer);

  timer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 2600);
}

function initials(name = "??") {
  return name.split(/\s+/).map(v => v[0]).join("").slice(0, 2).toUpperCase();
}

function overdue(task) {
  return task.due && task.status !== "done" && task.due < day(0);
}

function date(value) {
  if (!value) return "Sin fecha";

  const [year, month, dayNumber] = value.split("-");
  return `${dayNumber}/${month}/${year}`;
}

/* INICIO DE SESIÓN Y REGISTRO */

function showApp(currentUser) {
  user = currentUser;
  save(S, user);

  $("authView").hidden = true;
  $("appView").hidden = false;
  $("userChip").textContent = initials(user.name || user.email);

  $("welcome").innerHTML =
    `¡Hola, ${esc((user.name || "equipo").split(" ")[0])}! Vamos a organizarnos<span class="pink">.</span>`;

  render();
}

function showAuth() {
  $("appView").hidden = true;
  $("authView").hidden = false;
}

document.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;

    document.querySelectorAll("[data-mode]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    $("nameWrap").hidden = mode !== "register";
    $("authName").required = mode === "register";

    $("authSubmit").textContent =
      mode === "register"
        ? "Crear cuenta de demostración ♡"
        : "Entrar a mi tablero ♡";
  });
});

$("authForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("authEmail").value.trim().toLowerCase();
  const password = $("authPassword").value;
  const users = read(U, []);
  const name = $("authName").value.trim();

  if (mode === "register") {
    if (!name) return toast("Escribe tu nombre.");

    if (users.some(item => item.email === email)) {
      return toast("Ese correo ya está registrado.");
    }

    users.push({ email, pass: password, name });
    save(U, users);

    showApp({ email, name });
    toast("Cuenta de demostración creada ♡");
  } else {
    if (!users.length) {
      const displayName = email.split("@")[0];

      users.push({
        email,
        pass: password,
        name: displayName
      });

      save(U, users);
      showApp({ email, name: displayName });
      toast("Sesión de demostración iniciada.");
      return;
    }

    const account = users.find(item =>
      item.email === email && item.pass === password
    );

    if (!account) {
      return toast("Correo o contraseña incorrectos.");
    }

    showApp({ email, name: account.name });
    toast("¡Bienvenida/o de vuelta! ♡");
  }
});

$("logout").addEventListener("click", () => {
  localStorage.removeItem(S);
  user = null;
  showAuth();
});

/* BÚSQUEDA Y FILTROS */

function filtered() {
  const query = $("search").value.trim().toLowerCase();
  const priority = $("priorityFilter").value;
  const assignee = $("assigneeFilter").value;

  return tasks.filter(task =>
    (!query ||
      `${task.code} ${task.title} ${task.description} ${task.assignee}`
        .toLowerCase().includes(query)) &&
    (priority === "all" || task.priority === priority) &&
    (assignee === "all" || task.assignee === assignee)
  );
}

/* CREACIÓN VISUAL DE TARJETAS */

function card(task) {
  return `
    <article class="task" draggable="true" data-task="${esc(task.id)}">
      <span class="code">${esc(task.code || "SIN CÓDIGO")}</span>
      <span class="priority ${esc(task.priority)}">${esc(task.priority)}</span>

      <h3>${esc(task.title)}</h3>
      <p>${esc(task.description)}</p>

      <div class="meta">
        <span>${esc(task.assignee)}</span>
        <span class="${overdue(task) ? "late" : ""}">
          ${overdue(task) ? "Vencida · " : ""}${date(task.due)}
        </span>
      </div>

      <div class="actions">
        <button type="button" class="mini" data-move="${esc(task.id)}">Mover</button>
        <button type="button" class="mini" data-edit="${esc(task.id)}">Editar</button>
        <button type="button" class="mini" data-delete="${esc(task.id)}">Eliminar</button>
      </div>
    </article>
  `;
}

/* RENDERIZADO DEL TABLERO */

function render() {
  const visible = filtered();

  $("board").innerHTML = cols.map(column => {
    const allTasks = tasks.filter(task => task.status === column.id);
    const shownTasks = visible.filter(task => task.status === column.id);

    const hit = column.wip !== null && allTasks.length >= column.wip;

    return `
      <section class="column" data-col="${column.id}">
        <div class="col-head">
          <span>
            <i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${column.color}"></i>
            ${column.name}
            <span class="count">${allTasks.length}</span>
          </span>

          <span class="wip ${hit ? "hit" : ""}">
            ${column.wip === null ? "Sin límite" : `WIP ${allTasks.length}/${column.wip}`}
          </span>
        </div>

        <div class="task-list" data-zone="${column.id}">
          ${shownTasks.map(card).join("")}
        </div>

        <button type="button" class="add" data-add="${column.id}">
          ＋ Añadir tarjeta
        </button>
      </section>
    `;
  }).join("");

  $("total").textContent = tasks.length;

  $("progress").textContent =
    tasks.filter(task => task.status === "progress").length;

  $("done").textContent =
    tasks.filter(task => task.status === "done").length;

  $("overdue").textContent =
    tasks.filter(overdue).length;

  $("wipRows").innerHTML = cols
    .filter(column => column.wip !== null)
    .map(column => {
      const count = tasks.filter(task => task.status === column.id).length;

      return `
        <div class="wip-row">
          <span>${column.name}</span>

          <div class="track">
            <div class="fill" style="width:${Math.min(100, count / column.wip * 100)}%"></div>
          </div>

          <b>${count}/${column.wip}</b>
        </div>
      `;
    }).join("");

  $("eTask").innerHTML = tasks.map(task => `
    <option value="${esc(task.id)}">
      ${esc(task.code + " · " + task.title)}
    </option>
  `).join("");

  renderEvidence();
}

/* REGISTRO DE PRUEBAS */

function renderEvidence() {
  if (!evid.length) {
    $("eList").innerHTML = `
      <p class="muted small">
        Aún no hay registros. Guarda aquí el resultado de tus pruebas
        y la referencia de la captura.
      </p>
    `;
    return;
  }

  $("eList").innerHTML = [...evid].reverse().slice(0, 8).map(item => {
    const task = tasks.find(task => task.id === item.id);

    return `
      <div class="e-item">
        <b>${esc(task ? task.code + " · " + task.title : "Tarjeta eliminada")}</b>

        <span class="badge ${esc(item.result)}">${esc(item.result)}</span>

        <br>${esc(item.test)}
        <br>${esc(item.note || "Sin observaciones")} · ${esc(item.date)}
      </div>
    `;
  }).join("");
}

$("saveEvidence").addEventListener("click", () => {
  const id = $("eTask").value;
  const test = $("eTest").value.trim();

  if (!id || !test) {
    return toast("Selecciona una tarjeta y escribe la prueba.");
  }

  evid.push({
    id,
    test,
    result: $("eResult").value,
    note: $("eNote").value.trim(),
    date: new Date().toLocaleDateString("es-MX")
  });

  if (!save(E, evid)) return;

  $("eTest").value = "";
  $("eNote").value = "";

  renderEvidence();
  toast("Evidencia registrada ♡");
});

/* CONTROL DE LÍMITES WIP */

function canEnter(status, id = null) {
  const column = cols.find(column => column.id === status);

  return !column ||
    column.wip === null ||
    tasks.filter(task =>
      task.status === status && task.id !== id
    ).length < column.wip;
}

function move(id, status) {
  const task = tasks.find(task => task.id === id);

  if (!task || task.status === status) return;

  if (!canEnter(status, id)) {
    const column = cols.find(column => column.id === status);
    return toast(`Límite WIP alcanzado en ${column.name} (${column.wip}).`);
  }

  task.status = status;

  save(K, tasks);
  render();

  toast(`Tarjeta movida a ${cols.find(column => column.id === status).name} ♡`);
}

/* CREAR Y EDITAR TARJETAS */

function openCreate(status = "backlog") {
  $("taskForm").reset();
  $("taskId").value = "";
  $("dialogTitle").textContent = "Nueva tarjeta";
  $("taskStatus").value = status;
  $("taskPriority").value = "Media";

  $("taskDialog").showModal();
}

function openEdit(id) {
  const task = tasks.find(task => task.id === id);
  if (!task) return;

  $("taskId").value = task.id;
  $("taskCode").value = task.code || "";
  $("taskTitle").value = task.title;
  $("taskDesc").value = task.description;
  $("taskAssignee").value = task.assignee;
  $("taskPriority").value = task.priority;
  $("taskStatus").value = task.status;
  $("taskDue").value = task.due || "";
  $("taskEvidence").value = task.evidence || "";

  $("dialogTitle").textContent = "Editar " + (task.code || "tarjeta");

  $("taskDialog").showModal();
}

$("newTask").addEventListener("click", () => openCreate());

$("close").addEventListener("click", () => {
  $("taskDialog").close();
});

$("cancel").addEventListener("click", () => {
  $("taskDialog").close();
});

/* ACTUALIZACIÓN DE FILTROS */

["search", "priorityFilter", "assigneeFilter"].forEach(id => {
  $(id).addEventListener(
    id === "search" ? "input" : "change",
    render
  );
});

/* ACCIONES DE LAS TARJETAS */

$("board").addEventListener("click", event => {
  const add = event.target.closest("[data-add]");
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");
  const moveButton = event.target.closest("[data-move]");

  if (add) {
    return openCreate(add.dataset.add);
  }

  if (edit) {
    return openEdit(edit.dataset.edit);
  }

  if (remove) {
    const task = tasks.find(task => task.id === remove.dataset.delete);

    if (task && confirm(`¿Eliminar ${task.code}: ${task.title}?`)) {
      tasks = tasks.filter(item => item.id !== task.id);

      save(K, tasks);
      render();

      toast("Tarjeta eliminada.");
    }

    return;
  }

  if (moveButton) {
    const task = tasks.find(task => task.id === moveButton.dataset.move);
    if (!task) return;

    const choices = cols
      .map((column, index) => `${index + 1}. ${column.name}`)
      .join("\n");

    const answer = prompt(
      `Mover ${task.code} a:\n${choices}\nEscribe un número del 1 al 5.`
    );

    if (answer === null) return;

    const column = cols[Number(answer) - 1];

    if (!column) {
      return toast("Elige un número del 1 al 5.");
    }

    move(task.id, column.id);
  }
});

/* GUARDAR CAMBIOS DEL FORMULARIO */

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("taskId").value;
  const status = $("taskStatus").value;
  const code = $("taskCode").value.trim().toUpperCase();

  if (!canEnter(status, id || null)) {
    return toast("La columna seleccionada alcanzó su límite WIP.");
  }

  if (code && tasks.some(task =>
    task.code.toUpperCase() === code && task.id !== id
  )) {
    return toast("Ese código ya existe.");
  }

  const oldTask = tasks.find(task => task.id === id);

  const task = {
    id: id || "custom-" + Date.now(),
    code,
    title: $("taskTitle").value.trim(),
    description: $("taskDesc").value.trim(),
    assignee: $("taskAssignee").value,
    priority: $("taskPriority").value,
    status,
    due: $("taskDue").value,
    evidence: $("taskEvidence").value.trim()
  };

  if (!task.title || !task.assignee) {
    return toast("Completa el título y el responsable.");
  }

  tasks = oldTask
    ? tasks.map(item => item.id === id ? task : item)
    : [...tasks, task];

  if (!save(K, tasks)) return;

  $("taskDialog").close();

  render();

  toast(oldTask ? "Tarjeta actualizada ♡" : "Tarjeta creada ♡");
});

/* ARRASTRAR Y SOLTAR */

$("board").addEventListener("dragstart", event => {
  const taskCard = event.target.closest("[data-task]");
  if (!taskCard) return;

  dragId = taskCard.dataset.task;

  event.dataTransfer.setData("text/plain", dragId);
  taskCard.classList.add("dragging");
});

$("board").addEventListener("dragend", event => {
  const taskCard = event.target.closest("[data-task]");

  if (taskCard) {
    taskCard.classList.remove("dragging");
  }

  document.querySelectorAll(".column").forEach(column => {
    column.classList.remove("over");
  });

  dragId = null;
});

$("board").addEventListener("dragover", event => {
  const zone = event.target.closest("[data-zone]");

  if (zone) {
    event.preventDefault();
    zone.closest(".column").classList.add("over");
  }
});

$("board").addEventListener("dragleave", event => {
  const column = event.target.closest(".column");

  if (column && !column.contains(event.relatedTarget)) {
    column.classList.remove("over");
  }
});

$("board").addEventListener("drop", event => {
  const zone = event.target.closest("[data-zone]");
  if (!zone) return;

  event.preventDefault();

  document.querySelectorAll(".column").forEach(column => {
    column.classList.remove("over");
  });

  const id = event.dataTransfer.getData("text/plain") || dragId;

  if (id) {
    move(id, zone.dataset.zone);
  }
});

/* INICIAR APLICACIÓN */

initTheme();

if (user && user.email) {
  showApp(user);
} else {
  showAuth();
}