const staticDir = "./static/";
let jokersData = [];
let currentSort = "name";
const rarityFilter = new Set([1, 2, 3, 4]);
const stickerFilter = new Set(["yes", "no"]);
let searchQuery = "";
let pendingProfileJokers = null;
let pendingProfileData = null;
const filterStorageKey = "filters:jokers";
const normalizeJokerId = (id) => (id ? id.replace(/_/g, "-") : id);

document.addEventListener("DOMContentLoaded", () => {
  loadFilterState();
  initBackgroundShader();
  initProfileDiscard();
  initProfileImport();
  initSearchControl();
  initSortControls();
  initRarityFilters();
  initStickerFilters();
  loadJokers();
});

function loadFilterState() {
  try {
    const raw = localStorage.getItem(filterStorageKey);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed.sort) {
      currentSort = parsed.sort;
    }
    if (Array.isArray(parsed.rarity)) {
      rarityFilter.clear();
      parsed.rarity.forEach((value) => {
        const parsedValue = Number.parseInt(value, 10);
        if (!Number.isNaN(parsedValue)) {
          rarityFilter.add(parsedValue);
        }
      });
    }
    if (Array.isArray(parsed.sticker)) {
      stickerFilter.clear();
      parsed.sticker.forEach((value) => {
        if (value === "yes" || value === "no") {
          stickerFilter.add(value);
        }
      });
    }
  } catch (err) {
    console.warn("Failed to load saved filters:", err);
  }
}

function saveFilterState() {
  try {
    const payload = {
      sort: currentSort,
      rarity: Array.from(rarityFilter),
      sticker: Array.from(stickerFilter),
    };
    localStorage.setItem(filterStorageKey, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to save filters:", err);
  }
}

function loadJokers() {
  return fetch(staticDir + "jokers/data.json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Getting joker list error");
      }
      return response.json();
    })
    .then((jokers) => {
      jokersData = jokers.map((joker, index) => ({
        ...joker,
        _index: index,
      }));
      if (pendingProfileData) {
        const jokers = prepareJokerData(pendingProfileData, jokersData);
        applyProfileJokers(jokers);
        pendingProfileData = null;
        return;
      }
      if (pendingProfileJokers) {
        applyProfileJokers(pendingProfileJokers);
        pendingProfileJokers = null;
        return;
      }
      applySort();
      updateProgress();
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error, check the console");
    });
}

function renderJokerGrid(jokers) {
  const container = document.getElementById("card-grid");
  if (!container) {
    return;
  }

  const fragment = document.createDocumentFragment();

  jokers.forEach((joker) => {
    const cell = document.createElement("div");
    cell.className = "card-cell";

    const cardTilt = document.createElement("div");
    cardTilt.className = "card-wrapper";

    const card = document.createElement("div");
    card.className = "card";
    card.id = joker.id;
    const checked = getJokerChecked(joker.id);
    card.classList.toggle("is-checked", checked);
    card.dataset.jokerId = joker.id;
    card.setAttribute("role", "checkbox");
    card.setAttribute("aria-checked", checked ? "true" : "false");
    card.setAttribute("data-tilt", "");
    card.setAttribute("data-tilt-reverse", "true");
    card.setAttribute("data-tilt-perspective", "600");
    card.setAttribute("speed", "50");
    card.setAttribute("data-tilt-scale", "1.1");
    card.style.backgroundImage = `url("${staticDir}images/jokers/${joker.image}")`;
    card.addEventListener("click", () => {
      toggleJokerChecked(card, joker.id);
    });

    const rarityLabelMap = {
      1: "Common",
      2: "Uncommon",
      3: "Rare",
      4: "Legendary",
    };
    const rarityLabel = rarityLabelMap[Number(joker.rarity)] ?? (joker.rarity || "Undefined");

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-wrapper pixel-corners-2x8";
    tooltip.setAttribute("role", "tooltip");
    tooltip.innerHTML = `
      <div class="tooltip pixel-corners-2x6">
        <div class="tooltip-title">${joker.name || "Undefined"}</div>
        <div class="tooltip-description pixel-corners-2x6">${joker.description || "Undefined"}</div>
        <div class="${"rarity-" + rarityLabel.toLowerCase()} tooltip-rarity pixel-corners-2x6">${rarityLabel}</div>
      </div>
    `;

    cardTilt.appendChild(card);
    cell.appendChild(cardTilt);
    cell.appendChild(tooltip);
    fragment.appendChild(cell);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

function initTilt() {
  if (!window.VanillaTilt) {
    return;
  }

  const cards = document.querySelectorAll("#card-grid [data-tilt]");
  if (!cards.length) {
    return;
  }

  VanillaTilt.init(cards);
}

function getJokerChecked(jokerId) {
  return localStorage.getItem(`card:${jokerId}`) === "true";
}

function setJokerChecked(jokerId, checked) {
  localStorage.setItem(`card:${jokerId}`, checked ? "true" : "false");
}

function toggleJokerChecked(card, jokerId) {
  const nextState = !card.classList.contains("is-checked");
  card.classList.toggle("is-checked", nextState);
  card.setAttribute("aria-checked", nextState ? "true" : "false");
  setJokerChecked(jokerId, nextState);

  if (nextState) {
    card.classList.remove("sticker-pop");
    card.classList.add("sticker-pop");
    card.addEventListener(
      "animationend",
      () => {
        card.classList.remove("sticker-pop");
      },
      { once: true }
    );
  } else {
    card.classList.remove("sticker-pop-out");
    void card.offsetWidth;
    card.classList.add("sticker-pop-out");
    card.addEventListener(
      "animationend",
      () => {
        card.classList.remove("sticker-pop-out");
      },
      { once: true }
    );
  }

  const stickerKey = nextState ? "yes" : "no";
  if (!stickerFilter.has(stickerKey)) {
    applySort();
  } else {
    updateProgress();
  }
}

function initSortControls() {
  const sortInputs = document.querySelectorAll('#filters-group input[name="sort"]');
  if (!sortInputs.length) {
    return;
  }

  sortInputs.forEach((input) => {
    input.checked = input.value === currentSort;
    input.addEventListener("change", () => {
      if (!input.checked) {
        return;
      }
      currentSort = input.value;
      saveFilterState();
      applySort();
    });
  });
}

function applySort() {
  if (!jokersData.length) {
    return;
  }

  const filtered = jokersData.filter((joker) => {
    if (!rarityFilter.has(joker.rarity)) {
      return false;
    }
    if (searchQuery) {
      const name = joker.name ? joker.name.toLowerCase() : "";
      if (!name.includes(searchQuery)) {
        return false;
      }
    }
    const stickerState = getJokerChecked(joker.id) ? "yes" : "no";
    return stickerFilter.has(stickerState);
  });
  const sorted = [...filtered];
  if (currentSort === "name") {
    sorted.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
  } else if (currentSort === "rarity") {
    sorted.sort((a, b) => {
      const rarityDelta = (a.rarity || 0) - (b.rarity || 0);
      if (rarityDelta !== 0) {
        return rarityDelta;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
  } else {
    sorted.sort((a, b) => a._index - b._index);
  }

  renderJokerGrid(sorted);
  initTilt();
  updateProgress();
}

function initSearchControl() {
  const input = document.getElementById("search-input");
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    searchQuery = input.value.trim().toLowerCase();
    applySort();
  });
}

function initRarityFilters() {
  const rarityInputs = document.querySelectorAll('#filters-group input[name="rarity"]');
  if (!rarityInputs.length) {
    return;
  }

  rarityInputs.forEach((input) => {
    const value = Number.parseInt(input.value, 10);
    if (!Number.isNaN(value)) {
      input.checked = rarityFilter.has(value);
    }
    input.addEventListener("change", () => {
      const value = Number.parseInt(input.value, 10);
      if (Number.isNaN(value)) {
        return;
      }

      if (input.checked) {
        rarityFilter.add(value);
      } else {
        rarityFilter.delete(value);
      }
      saveFilterState();
      applySort();
    });
  });
}

function initStickerFilters() {
  const stickerInputs = document.querySelectorAll('#filters-group input[name="sticker"]');
  if (!stickerInputs.length) {
    return;
  }

  stickerInputs.forEach((input) => {
    const value = input.value;
    if (value === "yes" || value === "no") {
      input.checked = stickerFilter.has(value);
    }
    input.addEventListener("change", () => {
      const value = input.value;
      if (value !== "yes" && value !== "no") {
        return;
      }

      if (input.checked) {
        stickerFilter.add(value);
      } else {
        stickerFilter.delete(value);
      }
      saveFilterState();
      applySort();
    });
  });
}

function updateProgress() {
  if (!jokersData.length) {
    return;
  }

  const totals = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const checked = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalAll = 0;
  let checkedAll = 0;

  jokersData.forEach((joker) => {
    const rarity = joker.rarity || 0;
    if (totals[rarity] !== undefined) {
      totals[rarity] += 1;
    }
    totalAll += 1;
    if (getJokerChecked(joker.id)) {
      if (checked[rarity] !== undefined) {
        checked[rarity] += 1;
      }
      checkedAll += 1;
    }
  });

  updateProgressBar("all", checkedAll, totalAll);
  Object.keys(totals).forEach((rarity) => {
    updateProgressBar(rarity, checked[rarity], totals[rarity]);
  });
}

const progressAnimations = new WeakMap();

function animateProgressFill(bar, nextPercent) {
  const previousPercent = Number.parseFloat(bar.dataset.progress || "0") || 0;
  bar.dataset.progress = nextPercent.toFixed(2);

  const animeRoot = window.anime;
  const animate = animeRoot && (animeRoot.animate || animeRoot);
  if (typeof animate !== "function") {
    bar.style.setProperty("--progress", `${nextPercent}%`);
    return;
  }

  const delta = Math.abs(nextPercent - previousPercent);
  const duration = 1000;
  const overshoot = nextPercent >= previousPercent
    ? Math.min(100, nextPercent + 2)
    : Math.max(0, nextPercent - 2);

  const currentAnimation = progressAnimations.get(bar);
  if (currentAnimation) {
    currentAnimation.pause();
  }

  bar.classList.add("is-animating");
  const state = { value: previousPercent };
  const animation = animate(state, {
    value: delta > 1 ? [{ to: overshoot }, { to: nextPercent }] : nextPercent,
    duration,
    ease: "inOutExpo",
    update: () => {
      bar.style.setProperty("--progress", `${state.value}%`);
    },
    complete: () => {
      bar.style.setProperty("--progress", `${nextPercent}%`);
      bar.classList.remove("is-animating");
    },
  });

  progressAnimations.set(bar, animation);
}

function updateProgressBar(key, checkedCount, totalCount) {
  const wrapper = document.querySelector(`.progress-bar-wrapper[data-rarity="${key}"]`);
  if (!wrapper) {
    return;
  }
  const bar = wrapper.querySelector(".progress-bar");
  const label = wrapper.querySelector(".progress-bar > h3");
  const percent = totalCount ? (checkedCount / totalCount) * 100 : 0;
  if (bar) {
    animateProgressFill(bar, percent);
  }
  if (label) {
    label.textContent = `${percent.toFixed(2)}% (${checkedCount}/${totalCount})`;
  }
}

function initProfileDiscard() {
  const discardButton = document.getElementById("discard");
  const fileInput = document.querySelector('#upload input[type="file"]');
  if (!discardButton || !fileInput) {
    return;
  }

  discardButton.addEventListener("click", () => {
    fileInput.value = "";
    try {
      const dataTransfer = new DataTransfer();
      fileInput.files = dataTransfer.files;
    } catch (err) {
      /* Some browsers block assigning files; value reset is enough. */
    }
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function initProfileImport() {
  const fileInput = document.querySelector('#upload input[type="file"]');
  if (!fileInput) {
    return;
  }

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const decompressedData = await decompressFile(file);
      const saveData = parseObj(decompressedData);
      const jokers = prepareJokerData(saveData, jokersData);
      if (!Object.keys(jokers).length) {
        alert("No joker data found in profile. Make sure you selected profile.jkr.");
        return;
      }
      if (!jokersData.length) {
        pendingProfileData = saveData;
        return;
      }
      applyProfileJokers(jokers);
    } catch (err) {
      console.error("Decompression failed:", err);
      alert("Error, check the console");
    }
  });
}

function decompressFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        const decompressedData = pako.inflateRaw(uint8Array);
        const decodedData = new TextDecoder().decode(decompressedData);
        resolve(decodedData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseObj(data) {
  const result = data
    .slice(7)
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/=/g, ":")
    .replace(/,}/g, "}")
    .replace(/(\d+):/g, (match, p1) => `"${p1}":`);
  return JSON.parse(result);
}

function buildInGameNameMap(jokerList) {
  const map = new Map();
  jokerList.forEach((joker) => {
    if (!joker || !joker["in-game-name"]) {
      return;
    }
    map.set(joker["in-game-name"], joker.id);
  });
  return map;
}

function prepareJokerData(data, jokerList) {
  const jokers = {};
  const usage = data && data.joker_usage;
  if (!usage) {
    return jokers;
  }

  const inGameNameMap = Array.isArray(jokerList) ? buildInGameNameMap(jokerList) : new Map();

  for (const [jId, playInfo] of Object.entries(usage)) {
    const wins = playInfo && playInfo.wins;
    if (!wins || typeof wins !== "object") {
      const lookupId = inGameNameMap.get(jId) || normalizeJokerId(jId);
      jokers[lookupId] = false;
      continue;
    }
    const goldStakeWins = wins["8"];
    const lookupId = inGameNameMap.get(jId) || normalizeJokerId(jId);
    jokers[lookupId] = Number(goldStakeWins) > 0;
  }
  return jokers;
}

function applyProfileJokers(jokers) {
  jokersData.forEach((joker) => {
    const checked = jokers[normalizeJokerId(joker.id)] === true;
    setJokerChecked(joker.id, checked);
  });

  applySort();
  updateProgress();
}

// SHADER init by our friend CodeX.
function initBackgroundShader() {
  const canvas = document.getElementById("background");
  if (!canvas) {
    return;
  }

  const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
  if (!gl) {
    console.warn("WebGL not supported for shader background.");
    return;
  }

  fetch("/static/shaders/background.fs")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load shader source.");
      }
      return response.text();
    })
    .then((source) => {
      startShaderBackground(gl, canvas, source);
    })
    .catch((error) => {
      console.error("Shader background error:", error);
    });
}

function startShaderBackground(gl, canvas, shaderSource) {
  const vertexSource = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

  const fragmentSource = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
${shaderSource}
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

  const program = createProgram(gl, vertexSource, fragmentSource);
  if (!program) {
    return;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const timeLocation = gl.getUniformLocation(program, "iTime");
  const resolutionLocation = gl.getUniformLocation(program, "iResolution");

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  function render(time) {
    resizeCanvas();
    gl.useProgram(program);
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shader program failed:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
