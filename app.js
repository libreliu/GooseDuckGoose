const QUESTIONS_PER_GAME = 6;
const SOURCE_FILE = "assets/sources.json";

const state = {
  dishes: [],
  round: 0,
  score: 0,
  answered: false,
  showQr: true,
  history: [],
  order: []
};

const els = {
  roundLabel: document.querySelector("#roundLabel"),
  scoreLabel: document.querySelector("#scoreLabel"),
  progressBar: document.querySelector("#progressBar"),
  dishImage: document.querySelector("#dishImage"),
  imageStatus: document.querySelector("#imageStatus"),
  roundNote: document.querySelector("#roundNote"),
  dishTitle: document.querySelector("#dishTitle"),
  dishHint: document.querySelector("#dishHint"),
  choiceGrid: document.querySelector("#choiceGrid"),
  choices: [...document.querySelectorAll(".choice")],
  feedback: document.querySelector("#feedback"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  feedbackText: document.querySelector("#feedbackText"),
  sourceLink: document.querySelector("#sourceLink"),
  sourceButton: document.querySelector("#sourceButton"),
  sourceModal: document.querySelector("#sourceModal"),
  sourceCloseButton: document.querySelector("#sourceCloseButton"),
  sourceList: document.querySelector("#sourceList"),
  nextButton: document.querySelector("#nextButton"),
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  reviewList: document.querySelector("#reviewList"),
  restartButton: document.querySelector("#restartButton"),
  toggleQrButton: document.querySelector("#toggleQrButton"),
  shareScore: document.querySelector("#shareScore"),
  shareUrl: document.querySelector("#shareUrl"),
  shareQrBlock: document.querySelector("#shareQrBlock"),
  shareQrCanvas: document.querySelector("#shareQrCanvas"),
  shareQrHint: document.querySelector("#shareQrHint"),
  accuracyLabel: document.querySelector("#accuracyLabel"),
  totalLabel: document.querySelector("#totalLabel"),
  miniReview: document.querySelector("#miniReview")
};

els.choiceGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".choice");
  if (!button || state.answered) return;
  answerQuestion(button.dataset.answer);
});

els.nextButton.addEventListener("click", () => {
  state.round += 1;
  if (state.round >= state.order.length) {
    showResult();
    return;
  }
  renderQuestion();
});

els.restartButton.addEventListener("click", () => {
  startGame();
});

els.toggleQrButton.addEventListener("click", () => {
  state.showQr = !state.showQr;
  updateQrVisibility();
});

els.sourceButton.addEventListener("click", (event) => {
  event.preventDefault();
  openSourceModal();
});

els.sourceCloseButton.addEventListener("click", () => {
  closeSourceModal();
});

els.sourceModal.addEventListener("click", (event) => {
  if (event.target === els.sourceModal) {
    closeSourceModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.sourceModal.hidden) {
    closeSourceModal();
  }
});

initGame();

async function initGame() {
  setLoadingState();

  try {
    const response = await fetch(SOURCE_FILE);
    if (!response.ok) {
      throw new Error(`题库加载失败：${response.status}`);
    }
    state.dishes = normalizeDishes(await response.json());
    renderSourceList();
    startGame();
  } catch (error) {
    showLoadError(error);
  }
}

function startGame() {
  state.round = 0;
  state.score = 0;
  state.answered = false;
  state.history = [];
  state.order = sampleQuestions(state.dishes, QUESTIONS_PER_GAME);

  document.querySelector(".game").hidden = false;
  els.resultPanel.hidden = true;
  renderQuestion();
}

function setLoadingState() {
  els.roundLabel.textContent = "准备题库";
  els.scoreLabel.textContent = "0 分";
  els.progressBar.style.width = "0";
  els.dishTitle.textContent = "正在整理饭局照片";
  els.dishHint.textContent = "题目会从本地 assets/sources.json 随机抽取。";
  els.roundNote.textContent = "稍等片刻";
  els.imageStatus.hidden = false;
  els.imageStatus.textContent = "正在加载题库...";
  els.choices.forEach((choice) => {
    choice.disabled = true;
  });
}

function showLoadError(error) {
  els.dishTitle.textContent = "题库没端上来";
  els.dishHint.textContent = "请用静态服务器打开页面，例如 python -m http.server 4173。";
  els.imageStatus.hidden = false;
  els.imageStatus.textContent = error.message;
}

function renderQuestion() {
  const dish = currentDish();
  state.answered = false;

  els.roundLabel.textContent = `第 ${state.round + 1} / ${state.order.length} 题`;
  els.scoreLabel.textContent = `${state.score} 分`;
  els.progressBar.style.width = `${(state.round / state.order.length) * 100}%`;
  els.roundNote.textContent = state.round === 0 ? "第一口先别慌" : "继续盯紧这盘";
  els.dishTitle.textContent = "这碗饭局，主角是谁？";
  els.dishHint.textContent = "凭颜色、切法、配菜和直觉判断：这是鹅，还是鸭？";

  els.dishImage.classList.remove("loaded");
  els.dishImage.alt = "待鉴定的鹅或鸭料理照片";
  els.dishImage.src = dish.image;
  els.imageStatus.hidden = false;
  els.imageStatus.textContent = "正在上菜...";
  els.dishImage.onload = () => {
    els.dishImage.classList.add("loaded");
    els.imageStatus.hidden = true;
  };
  els.dishImage.onerror = () => {
    els.imageStatus.hidden = false;
    els.imageStatus.textContent = "照片暂时没端上来，但题目还能继续。";
  };

  els.feedback.hidden = true;
  els.nextButton.hidden = true;
  els.nextButton.textContent = state.round === state.order.length - 1 ? "看成绩" : "下一题";
  els.choices.forEach((choice) => {
    choice.disabled = false;
    choice.classList.remove("is-picked");
  });
}

function answerQuestion(choice) {
  const dish = currentDish();
  const correct = choice === dish.answer;
  state.answered = true;
  state.score += correct ? 1 : 0;
  state.history.push({ ...dish, choice, correct });

  els.scoreLabel.textContent = `${state.score} 分`;
  els.progressBar.style.width = `${((state.round + 1) / state.order.length) * 100}%`;
  els.choices.forEach((button) => {
    button.disabled = true;
    button.classList.toggle("is-picked", button.dataset.answer === choice);
  });

  const rightName = dish.answer === "goose" ? "鹅" : "鸭";
  els.feedbackTitle.textContent = correct ? `猜中了，是${rightName}` : `差一点，是${rightName}`;
  els.feedbackText.textContent = `${dish.title}。${dish.clue}`;
  els.sourceLink.hidden = !dish.source;
  els.sourceLink.href = dish.source || "#";
  els.feedback.hidden = false;
  els.nextButton.hidden = false;
}

function showResult() {
  document.querySelector(".game").hidden = true;
  els.resultPanel.hidden = false;

  const total = state.order.length;
  const percent = Math.round((state.score / total) * 100);
  const title = percent >= 88 ? "摊前大师" : percent >= 63 ? "饭局半仙" : percent >= 38 ? "还有救的食探" : "被油亮外皮迷住了";
  els.resultTitle.textContent = `${state.score} / ${total}：${title}`;
  els.resultText.textContent = resultLine(percent);
  els.shareScore.textContent = `${state.score}/${total}`;
  els.accuracyLabel.textContent = `${percent}%`;
  els.totalLabel.textContent = `${total}`;
  renderShareLink();
  updateQrVisibility();
  els.reviewList.innerHTML = state.history.map(reviewCard).join("");
  els.miniReview.innerHTML = state.history.map(miniReviewItem).join("");
}

function renderShareLink() {
  const shareUrl = getShareUrl();
  els.shareUrl.href = shareUrl;
  els.shareUrl.textContent = shareUrl;
  renderQrCode(shareUrl);
}

function getShareUrl() {
  if (window.GDG_SHARE_URL) return window.GDG_SHARE_URL;
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  return url.toString();
}

function updateQrVisibility() {
  els.shareQrBlock.hidden = !state.showQr;
  els.toggleQrButton.textContent = state.showQr ? "隐藏二维码" : "显示二维码";
}

function reviewCard(item, index) {
  const answer = item.answer === "goose" ? "鹅" : "鸭";
  const picked = item.choice === "goose" ? "鹅" : "鸭";
  return `
    <article class="review-card">
      <img src="${item.image}" alt="${item.title}">
      <div>
        <strong>${index + 1}. ${item.title}</strong>
        <p>${item.correct ? "答对" : "答错"}：你选${picked}，答案是${answer}</p>
      </div>
    </article>
  `;
}

function miniReviewItem(item, index) {
  const mark = item.correct ? "✓" : "×";
  const label = item.answer === "goose" ? "鹅" : "鸭";
  return `
    <div class="mini-review-item ${item.correct ? "is-right" : "is-wrong"}" title="第 ${index + 1} 题：${item.title}">
      <img src="${item.image}" alt="">
      <span>${mark}</span>
      <small>${label}</small>
    </div>
  `;
}

function resultLine(percent) {
  if (percent >= 88) return "你已经可以在热闹饭点稳稳接过菜单，鹅鸭之争很难骗过你。";
  if (percent >= 63) return "大方向很准，偶尔会被脆皮和切片摆盘带偏。";
  if (percent >= 38) return "直觉有亮点，但还需要多看几盘腿、皮、配菜和菜名。";
  return "别灰心，这本来就是一场油亮外皮制造的视觉陷阱。";
}

function normalizeDishes(records) {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    answer: record.answer,
    image: record.file,
    source: record.sourceUrl || "",
    downloadUrl: record.downloadUrl || "",
    provider: record.provider || "未注明来源",
    clue: record.clue
  }));
}

function renderSourceList() {
  if (!state.dishes.length) {
    els.sourceList.innerHTML = "<p class=\"source-empty\">题库还没加载完成。</p>";
    return;
  }

  els.sourceList.innerHTML = state.dishes.map((dish) => `
    <article class="source-item">
      <img src="${escapeAttribute(dish.image)}" alt="${escapeAttribute(dish.title)}">
      <div>
        <h3>${escapeHtml(dish.title)}</h3>
        <dl>
          <div>
            <dt>图片 URL</dt>
            <dd><code>${escapeHtml(dish.image)}</code></dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>${escapeHtml(dish.provider)}</dd>
          </div>
          <div>
            <dt>来源页面</dt>
            <dd>${sourceAnchor(dish.source)}</dd>
          </div>
          <div>
            <dt>下载 URL</dt>
            <dd>${sourceAnchor(dish.downloadUrl)}</dd>
          </div>
        </dl>
      </div>
    </article>
  `).join("");
}

function sourceAnchor(url) {
  if (!url) return "<span>未填写</span>";
  return `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`;
}

function openSourceModal() {
  renderSourceList();
  els.sourceModal.hidden = false;
  document.body.classList.add("modal-open");
  els.sourceCloseButton.focus();
}

function closeSourceModal() {
  els.sourceModal.hidden = true;
  document.body.classList.remove("modal-open");
  els.sourceButton.focus();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function renderQrCode(text) {
  try {
    const matrix = createQrMatrix(text);
    drawQrMatrix(matrix, els.shareQrCanvas);
    els.shareQrHint.textContent = "扫码来玩";
  } catch (error) {
    const context = els.shareQrCanvas.getContext("2d");
    context.clearRect(0, 0, els.shareQrCanvas.width, els.shareQrCanvas.height);
    els.shareQrHint.textContent = "URL 过长，请直接复制上方链接";
  }
}

function drawQrMatrix(matrix, canvas) {
  const quietZone = 4;
  const scale = Math.floor(canvas.width / (matrix.length + quietZone * 2));
  const offset = Math.floor((canvas.width - matrix.length * scale) / 2);
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1f2328";
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) {
        context.fillRect(offset + x * scale, offset + y * scale, scale, scale);
      }
    });
  });
}

function createQrMatrix(text) {
  const versions = [
    { version: 1, dataCodewords: 19, ecCodewords: 7 },
    { version: 2, dataCodewords: 34, ecCodewords: 10 },
    { version: 3, dataCodewords: 55, ecCodewords: 15 },
    { version: 4, dataCodewords: 80, ecCodewords: 20 },
    { version: 5, dataCodewords: 108, ecCodewords: 26 }
  ];
  const dataBytes = [...new TextEncoder().encode(text)];
  const qrVersion = versions.find((item) => dataBytes.length <= Math.floor((item.dataCodewords * 8 - 16) / 8));

  if (!qrVersion) {
    throw new Error("Share URL is too long for the built-in QR encoder.");
  }

  const dataCodewords = buildQrDataCodewords(dataBytes, qrVersion.dataCodewords);
  const ecCodewords = reedSolomonRemainder(dataCodewords, qrVersion.ecCodewords);
  return buildQrMatrix(qrVersion.version, [...dataCodewords, ...ecCodewords]);
}

function buildQrDataCodewords(bytes, dataCodewordCount) {
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const maxBits = dataCodewordCount * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }

  for (let pad = 0; codewords.length < dataCodewordCount; pad += 1) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return codewords;
}

function appendBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function buildQrMatrix(version, codewords) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (x, y, dark) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  drawFinderPattern(setFunctionModule, 3, 3, size);
  drawFinderPattern(setFunctionModule, size - 4, 3, size);
  drawFinderPattern(setFunctionModule, 3, size - 4, size);
  drawTimingPatterns(setFunctionModule, isFunction, size);
  if (version > 1) {
    const alignment = version * 4 + 10;
    drawAlignmentPattern(setFunctionModule, alignment, alignment);
  }
  drawFormatBits(setFunctionModule, size, 0);
  setFunctionModule(8, size - 8, true);
  placeQrData(modules, isFunction, codewords);
  applyQrMask(modules, isFunction);
  drawFormatBits(setFunctionModule, size, 0);

  return modules;
}

function drawFinderPattern(setFunctionModule, centerX, centerY, size) {
  for (let y = -4; y <= 4; y += 1) {
    for (let x = -4; x <= 4; x += 1) {
      const moduleX = centerX + x;
      const moduleY = centerY + y;
      if (moduleX < 0 || moduleX >= size || moduleY < 0 || moduleY >= size) continue;
      const distance = Math.max(Math.abs(x), Math.abs(y));
      setFunctionModule(moduleX, moduleY, distance !== 2 && distance !== 4);
    }
  }
}

function drawAlignmentPattern(setFunctionModule, centerX, centerY) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      const distance = Math.max(Math.abs(x), Math.abs(y));
      setFunctionModule(centerX + x, centerY + y, distance !== 1);
    }
  }
}

function drawTimingPatterns(setFunctionModule, isFunction, size) {
  for (let index = 0; index < size; index += 1) {
    const dark = index % 2 === 0;
    if (!isFunction[6][index]) setFunctionModule(index, 6, dark);
    if (!isFunction[index][6]) setFunctionModule(6, index, dark);
  }
}

function drawFormatBits(setFunctionModule, size, mask) {
  const errorCorrectionLevel = 1;
  const data = (errorCorrectionLevel << 3) | mask;
  let remainder = data;
  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }
  const bits = ((data << 10) | remainder) ^ 0x5412;
  const bit = (index) => ((bits >>> index) & 1) !== 0;

  for (let index = 0; index <= 5; index += 1) setFunctionModule(8, index, bit(index));
  setFunctionModule(8, 7, bit(6));
  setFunctionModule(8, 8, bit(7));
  setFunctionModule(7, 8, bit(8));
  for (let index = 9; index < 15; index += 1) setFunctionModule(14 - index, 8, bit(index));

  for (let index = 0; index < 8; index += 1) setFunctionModule(size - 1 - index, 8, bit(index));
  for (let index = 8; index < 15; index += 1) setFunctionModule(8, size - 15 + index, bit(index));
}

function placeQrData(modules, isFunction, codewords) {
  const size = modules.length;
  let bitIndex = 0;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical += 1) {
      for (let column = 0; column < 2; column += 1) {
        const x = right - column;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        if (isFunction[y][x]) continue;
        const bit = bitIndex < codewords.length * 8
          ? ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0
          : false;
        modules[y][x] = bit;
        bitIndex += 1;
      }
    }
  }
}

function applyQrMask(modules, isFunction) {
  modules.forEach((row, y) => {
    row.forEach((_, x) => {
      if (!isFunction[y][x] && (x + y) % 2 === 0) {
        modules[y][x] = !modules[y][x];
      }
    });
  });
}

function reedSolomonRemainder(data, degree) {
  const divisor = reedSolomonDivisor(degree);
  const result = Array(degree).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    divisor.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  });

  return result;
}

function reedSolomonDivisor(degree) {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;

  for (let index = 0; index < degree; index += 1) {
    for (let term = 0; term < degree; term += 1) {
      result[term] = gfMultiply(result[term], root);
      if (term + 1 < degree) result[term] ^= result[term + 1];
    }
    root = gfMultiply(root, 0x02);
  }

  return result;
}

function gfMultiply(left, right) {
  let result = 0;
  for (let index = 7; index >= 0; index -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((right >>> index) & 1) * left;
  }
  return result & 0xff;
}

function currentDish() {
  return state.order[state.round];
}

function sampleQuestions(items, count) {
  return shuffle([...items]).slice(0, Math.min(count, items.length));
}

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}
