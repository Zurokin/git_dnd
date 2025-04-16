import "./styles.css";

const defaultData = {
  todo: [
    { id: "1", text: "Сделать верстку доски" },
    { id: "2", text: "Сохранение состояния в localStorage" },
  ],
  inProgress: [{ id: "3", text: "Реализовать перемещение карточек" }],
  done: [{ id: "4", text: "Настроить Webpack" }],
};

function loadData() {
  const data = localStorage.getItem("trello-data");
  try {
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    console.error(
      "Ошибка загрузки данных из localStorage, используем значения по умолчанию"
    );
    return defaultData;
  }
}

function saveData(data) {
  try {
    localStorage.setItem("trello-data", JSON.stringify(data));
  } catch (e) {
    console.error("Ошибка сохранения данных в localStorage");
  }
}

function createCard(card, columnKey, data) {
  const el = document.createElement("div");
  el.className = "card";
  el.textContent = card.text;
  el.dataset.id = card.id;
  el.dataset.column = columnKey;

  // Крестик для удаления
  const del = document.createElement("span");
  del.className = "delete";
  del.innerHTML = "&times;";
  del.style.cursor = "pointer";
  del.onclick = (e) => {
    e.stopPropagation();
    data[columnKey] = data[columnKey].filter((c) => c.id !== card.id);
    saveData(data);
    render();
  };
  el.appendChild(del);

  el.setAttribute("draggable", true);

  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("cardId", card.id);
    e.dataTransfer.setData("columnKey", columnKey);
  });

  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.style.opacity = 0.5;
  });

  el.addEventListener("dragleave", () => {
    el.style.opacity = 1;
  });

  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.style.opacity = 1;

    const draggedCardId = e.dataTransfer.getData("cardId");
    const fromColumnKey = e.dataTransfer.getData("columnKey");
    const toColumnKey = columnKey;

    if (!draggedCardId || !fromColumnKey) return;

    const draggedCard = data[fromColumnKey].find((c) => c.id === draggedCardId);
    if (!draggedCard || draggedCard.id === card.id) return;

    // Индекс карточки, на которую бросаем
    const targetIndex = data[toColumnKey].findIndex((c) => c.id === card.id);
    // Индекс перетаскиваемой карточки в исходной колонке
    const fromIndex = data[fromColumnKey].findIndex(
      (c) => c.id === draggedCardId
    );

    // Определяем позицию вставки
    const offset =
      e.clientY > el.getBoundingClientRect().top + el.offsetHeight / 2 ? 1 : 0;

    // Если перемещаем карточку в начало
    let insertIndex = targetIndex === -1 ? 0 : targetIndex + offset;

    // Если перемещение внутри одной колонки и сдвигается вниз
    if (fromColumnKey === toColumnKey && fromIndex < insertIndex) {
      insertIndex--;
    }

    // Удаляем из старого места
    data[fromColumnKey] = data[fromColumnKey].filter(
      (c) => c.id !== draggedCard.id
    );

    // Вставляем в нужное место
    data[toColumnKey].splice(insertIndex, 0, draggedCard);
    saveData(data);
    render();
  });

  return el;
}

function createColumn(title, key, data) {
  const column = document.createElement("div");
  column.className = "column";
  column.dataset.key = key;

  const header = document.createElement("div");
  header.className = "column-title";
  header.textContent = title;

  const cardContainer = document.createElement("div");
  cardContainer.className = "card-container";

  // События для drop на пустое место в колонке
  cardContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    cardContainer.style.backgroundColor = "#f0f0f0";
  });

  cardContainer.addEventListener("dragleave", () => {
    cardContainer.style.backgroundColor = "";
  });

  cardContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    cardContainer.style.backgroundColor = "";

    const draggedCardId = e.dataTransfer.getData("cardId");
    const fromColumnKey = e.dataTransfer.getData("columnKey");
    const toColumnKey = key;

    if (!draggedCardId || !fromColumnKey) return;

    const draggedCard = data[fromColumnKey].find((c) => c.id === draggedCardId);
    if (!draggedCard) return;

    // Индекс перетаскиваемой карточки
    const targetIndex = data[toColumnKey].findIndex(
      (c) => c.id === draggedCard.id
    );

    // Если перемещение в пустую колонку или перед первым элементом
    const offset =
      e.clientY >
      cardContainer.getBoundingClientRect().top + cardContainer.offsetHeight / 2
        ? 1
        : 0;
    let insertIndex = targetIndex === -1 ? 0 : targetIndex + offset;

    // Если перемещение внутри одной колонки и сдвигается вниз
    if (fromColumnKey === toColumnKey) {
      const fromIndex = data[fromColumnKey].findIndex(
        (c) => c.id === draggedCard.id
      );
      if (fromIndex < insertIndex) {
        insertIndex--;
      }
    }

    // Удаляем карточку из старого места
    data[fromColumnKey] = data[fromColumnKey].filter(
      (c) => c.id !== draggedCard.id
    );

    // Вставляем в новое место
    data[toColumnKey].splice(insertIndex, 0, draggedCard);
    saveData(data);
    render();
  });

  data[key].forEach((card) => {
    const cardEl = createCard(card, key, data);
    cardContainer.appendChild(cardEl);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-card";
  addBtn.textContent = "Add another card";
  addBtn.onclick = () => {
    const text = prompt("Enter card text");
    if (text) {
      const id = Date.now().toString();
      data[key].push({ id, text });
      saveData(data);
      render();
    }
  };

  column.appendChild(header);
  column.appendChild(cardContainer);
  column.appendChild(addBtn);

  return column;
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const board = document.createElement("div");
  board.className = "board";

  const data = loadData();
  board.appendChild(createColumn("To Do", "todo", data));
  board.appendChild(createColumn("In Progress", "inProgress", data));
  board.appendChild(createColumn("Done", "done", data));

  app.appendChild(board);
}

render();
