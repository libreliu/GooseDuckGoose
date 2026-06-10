const QUESTIONS_PER_GAME = 6;
const SOURCE_FILE = "assets/sources.json";

const state = {
  dishes: [],
  round: 0,
  score: 0,
  answered: false,
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
  nextButton: document.querySelector("#nextButton"),
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  reviewList: document.querySelector("#reviewList"),
  restartButton: document.querySelector("#restartButton")
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

initGame();

async function initGame() {
  setLoadingState();

  try {
    const response = await fetch(SOURCE_FILE);
    if (!response.ok) {
      throw new Error(`题库加载失败：${response.status}`);
    }
    state.dishes = normalizeDishes(await response.json());
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
  els.reviewList.innerHTML = state.history.map(reviewCard).join("");
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
    clue: record.clue
  }));
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
