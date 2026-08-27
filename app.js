```javascript
/* ============================================================
   ANIMAL OPPOSITES — app.js
   ============================================================ */

const LEVELS = [
  {
    id: 1,
    title: "Level 1 — Little Learner",
    description: "Easy opposites you can see and feel.",
    pairs: [
      ["big", "small", "🐘", "🐭", "Size"],
      ["hot", "cold", "☀️", "🧊", "Temperature"],
      ["fast", "slow", "🐆", "🐢", "Speed"],
      ["happy", "sad", "😊", "😢", "Feelings"],
      ["up", "down", "🎈", "🪨", "Position"],
      ["in", "out", "🏠", "🌳", "Position"],
      ["open", "closed", "🚪", "🔒", "Everyday"],
      ["on", "off", "💡", "🌑", "Everyday"],
      ["day", "night", "☀️", "🌙", "Time"],
      ["loud", "quiet", "🥁", "🤫", "Sound"]
    ]
  },

  {
    id: 2,
    title: "Level 2 — Animal Explorer",
    description: "Everyday opposites.",
    pairs: [
      ["tall", "short", "🦒", "🐛", "Size"],
      ["light", "dark", "☀️", "🌑", "Light"],
      ["old", "young", "👴", "👶", "Age"],
      ["new", "old", "🆕", "🧸", "Age"],
      ["good", "bad", "👍", "👎", "Choices"],
      ["clean", "dirty", "🧼", "🟤", "Everyday"],
      ["full", "empty", "🥛", "🫗", "Everyday"],
      ["wet", "dry", "💦", "☀️", "Everyday"],
      ["hard", "soft", "🪨", "🧸", "Touch"],
      ["heavy", "light", "🐘", "🪶", "Weight"],
      ["near", "far", "🏠", "🌙", "Distance"],
      ["high", "low", "✈️", "🐜", "Position"],
      ["inside", "outside", "🏠", "🌳", "Position"],
      ["front", "back", "🚗", "🚙", "Position"],
      ["left", "right", "👈", "👉", "Direction"],
      ["before", "after", "🌅", "🌙", "Time"],
      ["first", "last", "🥇", "🏃", "Order"],
      ["early", "late", "🌅", "🌙", "Time"],
      ["awake", "asleep", "👀", "😴", "State"],
      ["push", "pull", "🛒", "🚪", "Action"],
      ["give", "take", "🎁", "🤲", "Action"],
      ["come", "go", "🏠", "🚶", "Action"],
      ["start", "stop", "🏃", "🛑", "Action"]
    ]
  },

  {
    id: 3,
    title: "Level 3 — Super Explorer",
    description: "Trickier words and ideas.",
    pairs: [
      ["laugh", "cry", "😂", "😭", "Feelings"],
      ["love", "hate", "❤️", "😖", "Feelings"],
      ["true", "false", "✅", "❌", "Ideas"],
      ["same", "different", "👕", "👗", "Ideas"],
      ["easy", "difficult", "🙂", "🧩", "Difficulty"],
      ["kind", "mean", "❤️", "😠", "Choices"],
      ["brave", "scared", "🦁", "😨", "Feelings"],
      ["safe", "dangerous", "🪖", "🔥", "Safety"],
      ["pretty", "ugly", "🌸", "🗑️", "Appearance"],
      ["thick", "thin", "📚", "📄", "Size"],
      ["wide", "narrow", "🛣️", "🚶", "Size"],
      ["long", "short", "🦒", "🐛", "Size"],
      ["deep", "shallow", "🌊", "🛁", "Depth"],
      ["smooth", "rough", "🪞", "🪨", "Touch"],
      ["sweet", "sour", "🍬", "🍋", "Taste"],
      ["strong", "weak", "💪", "🐜", "Strength"],
      ["many", "few", "🐟🐟🐟", "🐟", "Amount"],
      ["more", "less", "🍪🍪🍪", "🍪", "Amount"],
      ["all", "none", "👧👦👶", "⭕", "Amount"],
      ["yes", "no", "👍", "👎", "Choices"]
    ]
  }
];

const AVATARS = [
  "🐼", "🐨", "🦊", "🐸",
  "🐯", "🐵", "🐰", "🐻"
];

const STORAGE_KEY = "animalOpposites_v3";

const PRAISE = [
  "Great job!",
  "Yes!",
  "You got it!",
  "Super!",
  "Amazing!",
  "Well done!"
];

let data = loadData();

let currentProfileId = null;
let currentLevel = 1;

let questions = [];
let questionIndex = 0;
let sessionScore = 0;
let sessionTotal = 0;

let currentQuestion = null;
let answered = false;

let selectedAvatar = AVATARS[0];

let pinBuffer = "";
let speechTimer = null;


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = id => document.getElementById(id);

const screens = {
  home: $("homeScreen"),
  create: $("createScreen"),
  levels: $("levelsScreen"),
  game: $("gameScreen"),
  result: $("resultScreen"),
  parent: $("parentScreen")
};


/* ============================================================
   STORAGE
   ============================================================ */

function defaultData() {
  return {
    profiles: [],

    settings: {
      sessionLength: 5,
      speechRate: 0.78,
      reduceMotion: false
    },

    parentPin: null
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultData();
    }

    const parsed = JSON.parse(raw);

    const defaults = defaultData();

    return {
      ...defaults,
      ...parsed,

      settings: {
        ...defaults.settings,
        ...(parsed.settings || {})
      }
    };

  } catch (error) {
    console.warn("Could not load saved progress.", error);
    return defaultData();
  }
}

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.warn("Could not save progress.", error);
  }
}

function getCurrentProfile() {
  return data.profiles.find(
    p => p.id === currentProfileId
  );
}


/* ============================================================
   PROFILE CREATION
   ============================================================ */

function openCreate() {
  showScreen("create");

  $("childName").value = "";

  selectedAvatar = AVATARS[0];

  renderAvatarPicker();
}

function renderAvatarPicker() {
  const container = $("avatarPicker");

  container.innerHTML = "";

  AVATARS.forEach(avatar => {

    const button = document.createElement("button");

    button.className =
      "avatar-choice" +
      (avatar === selectedAvatar ? " selected" : "");

    button.textContent = avatar;

    button.addEventListener("click", () => {
      selectedAvatar = avatar;
      renderAvatarPicker();
    });

    container.appendChild(button);
  });
}

function saveProfile() {
  const name = $("childName").value.trim();

  if (!name) {
    toast("Please choose a nickname.");
    return;
  }

  const id =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : String(Date.now());

  const profile = {
    id,
    name,
    avatar: selectedAvatar,

    stars: 0,
    sessions: 0,
    questions: 0,
    correct: 0,

    unlockedLevel: 1,

    weak: {},

    levelStats: {
      1: {
        played: 0,
        correct: 0
      },

      2: {
        played: 0,
        correct: 0
      },

      3: {
        played: 0,
        correct: 0
      }
    }
  };

  data.profiles.push(profile);

  saveData();

  currentProfileId = profile.id;

  showLevels();
}


/* ============================================================
   HOME
   ============================================================ */

function renderProfiles() {
  const container = $("profiles");

  container.innerHTML = "";

  if (!data.profiles.length) {

    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center">
        <p>No child profile yet.</p>
      </div>
    `;

    return;
  }

  data.profiles.forEach(profile => {

    const button = document.createElement("button");

    button.className = "profile";

    button.innerHTML = `
      <div class="avatar">
        ${profile.avatar}
      </div>

      <div class="name">
        ${escapeHTML(profile.name)}
      </div>

      <div class="stars">
        ⭐ ${profile.stars}
      </div>
    `;

    button.addEventListener("click", () => {

      currentProfileId = profile.id;

      showLevels();
    });

    container.appendChild(button);
  });
}


/* ============================================================
   LEVELS
   ============================================================ */

function showLevels() {
  const profile = getCurrentProfile();

  if (!profile) {
    showHome();
    return;
  }

  $("welcomeTitle").textContent =
    `${profile.avatar} Hi, ${profile.name}!`;

  renderLevels();

  showScreen("levels");
}

function renderLevels() {

  const profile = getCurrentProfile();

  const container = $("levelList");

  container.innerHTML = "";

  LEVELS.forEach(level => {

    const unlocked =
      profile.unlockedLevel >= level.id;

    const div = document.createElement("div");

    div.className =
      "level " +
      (unlocked ? "unlocked" : "locked");

    div.innerHTML = `
      <div class="level-title">
        ${unlocked ? "🔓" : "🔒"}
        ${level.title}
      </div>

      <div class="level-desc">
        ${level.description}
      </div>

      ${
        unlocked

          ? `
            <button
              class="primary"
              data-level="${level.id}">
              Play
            </button>
          `

          : `
            <div class="small">
              Finish the previous level to unlock this one.
            </div>
          `
      }
    `;

    if (unlocked) {

      div.querySelector("button")
        .addEventListener("click", () => {
          startGame(level.id);
        });
    }

    container.appendChild(div);
  });
}


/* ============================================================
   QUESTION CREATION
   ============================================================ */

function getPairsForLevel(levelId) {

  const level =
    LEVELS.find(level => level.id === levelId);

  return level ? level.pairs : [];
}

function makeQuestions(levelId, weakOnly = false) {

  let pairs = [];

  if (weakOnly) {

    const profile = getCurrentProfile();

    LEVELS.forEach(level => {

      level.pairs.forEach(pair => {

        const first = pair[0];
        const second = pair[1];

        if (
          (profile.weak[first] || 0) > 0 ||
          (profile.weak[second] || 0) > 0
        ) {
          pairs.push(pair);
        }
      });
    });

    if (!pairs.length) {
      weakOnly = false;
    }
  }

  if (!weakOnly) {
    pairs = getPairsForLevel(levelId);
  }

  const result = [];

  pairs.forEach(pair => {

    /*
      First direction:
      BIG -> SMALL
    */

    result.push({
      word: pair[0],
      answer: pair[1],

      emoji: pair[2],
      answerEmoji: pair[3],

      category: pair[4]
    });

    /*
      Second direction:
      SMALL -> BIG
    */

    result.push({
      word: pair[1],
      answer: pair[0],

      emoji: pair[3],
      answerEmoji: pair[2],

      category: pair[4]
    });
  });

  return shuffle(result);
}

function chooseSessionQuestions(allQuestions) {

  const desired =
    Number(data.settings.sessionLength) || 5;

  if (allQuestions.length <= desired) {
    return allQuestions;
  }

  const profile = getCurrentProfile();

  /*
    Put words that need practice near the front.
  */

  const weighted =
    [...allQuestions].sort((a, b) => {

      return (
        (profile.weak[b.word] || 0) -
        (profile.weak[a.word] || 0)
      );

    });

  const priorityCount =
    Math.min(
      Math.ceil(desired / 2),
      weighted.length
    );

  const priority =
    weighted.slice(0, priorityCount);

  const remaining =
    shuffle(weighted.slice(priorityCount));

  return shuffle([
    ...priority,
    ...remaining.slice(
      0,
      desired - priority.length
    )
  ]);
}


/* ============================================================
   START GAME
   ============================================================ */

function startGame(levelId, weakOnly = false) {

  currentLevel = levelId;

  const allQuestions =
    makeQuestions(levelId, weakOnly);

  questions =
    chooseSessionQuestions(allQuestions);

  if (!questions.length) {

    toast(
      "No words need extra practice yet!"
    );

    return;
  }

  questionIndex = 0;
  sessionScore = 0;
  sessionTotal = questions.length;

  answered = false;

  $("levelBadge").textContent =
    `Level ${levelId}`;

  $("gameScore").textContent = "0";

  showScreen("game");

  showQuestion();
}


/* ============================================================
   SHOW QUESTION
   ============================================================ */

function showQuestion() {

  clearTimeout(speechTimer);

  stopSpeaking();

  if (questionIndex >= questions.length) {

    finishGame();

    return;
  }

  currentQuestion =
    questions[questionIndex];

  answered = false;

  $("message").textContent = "";

  $("nextButton").style.display = "none";

  const question = currentQuestion;

  $("questionEmoji").textContent =
    question.emoji;

  $("questionWord").textContent =
    question.word.toUpperCase();

  $("instruction").textContent =
    `Find the opposite of ${
      question.word.toUpperCase()
    }!`;

  const progress =
    (questionIndex / questions.length) * 100;

  $("progressBar").style.width =
    `${progress}%`;

  renderChoices(question);

  /*
    Read the question automatically.
  */

  speechTimer = setTimeout(() => {

    speak(question.word);

    /*
      Then read each answer.
    */

    speechTimer = setTimeout(() => {

      const labels =
        [...document.querySelectorAll(
          ".choice .word"
        )].map(
          element => element.textContent
        );

      labels.forEach((label, index) => {

        setTimeout(() => {
          speak(label.toLowerCase());
        }, index * 850);

      });

    }, 1100);

  }, 300);
}


/* ============================================================
   ANSWER CHOICES
   ============================================================ */

function renderChoices(question) {

  const options = shuffle([
    question.answer,
    ...getDistractors(
      question.answer,
      question.word
    )
  ]);

  const container = $("choices");

  container.innerHTML = "";

  options.forEach(option => {

    const pair =
      findPairForWord(option);

    const button =
      document.createElement("button");

    button.className = "choice";

    button.innerHTML = `
      <div class="emoji">
        ${pair.emoji}
      </div>

      <div class="word">
        ${escapeHTML(
          option.toUpperCase()
        )}
      </div>
    `;

    button.addEventListener(
      "click",
      () => {

        speak(option);

        answerQuestion(
          button,
          option
        );
      }
    );

    container.appendChild(button);
  });
}

function getDistractors(
  correctAnswer,
  currentWord
) {

  const words = [];

  LEVELS.forEach(level => {

    level.pairs.forEach(pair => {

      pair.slice(0, 2).forEach(word => {

        if (
          word !== correctAnswer &&
          word !== currentWord &&
          !words.includes(word)
        ) {
          words.push(word);
        }

      });
    });
  });

  return shuffle(words).slice(0, 2);
}

function findPairForWord(word) {

  for (const level of LEVELS) {

    for (const pair of level.pairs) {

      if (pair[0] === word) {

        return {
          word,
          emoji: pair[2]
        };
      }

      if (pair[1] === word) {

        return {
          word,
          emoji: pair[3]
        };
      }
    }
  }

  return {
    word,
    emoji: "🐾"
  };
}


/* ============================================================
   ANSWER HANDLING
   ============================================================ */

function answerQuestion(
  button,
  selected
) {

  if (answered) return;

  const profile =
    getCurrentProfile();

  const question =
    currentQuestion;

  if (selected === question.answer) {

    answered = true;

    sessionScore++;

    profile.correct++;

    profile.questions++;

    profile.levelStats[currentLevel].played++;

    profile.levelStats[currentLevel].correct++;

    /*
      Success reduces the need for repetition.
    */

    if (profile.weak[question.word]) {

      profile.weak[question.word] =
        Math.max(
          0,
          profile.weak[question.word] - 1
        );
    }

    button.classList.add("correct");

    const praise =
      PRAISE[
        Math.floor(
          Math.random() * PRAISE.length
        )
      ];

    const text =
      `${praise} ${
        question.word
      } and ${
        question.answer
      } are opposites!`;

    $("message").textContent = text;

    speak(text);

    $("gameScore").textContent =
      sessionScore;

    document
      .querySelectorAll(".choice")
      .forEach(choice => {
        choice.disabled = true;
      });

    $("nextButton").style.display =
      "block";

    saveData();

  } else {

    button.classList.add("wrong");

    profile.questions++;

    /*
      Missed words receive extra practice.
    */

    profile.weak[question.word] =
      (profile.weak[question.word] || 0) + 2;

    saveData();

    $("message").textContent =
      "Almost! Try another one. 🐾";

    speak(
      "Almost. Try another one."
    );

    setTimeout(() => {

      button.classList.remove("wrong");

    }, 500);
  }
}


/* ============================================================
   FINISH GAME
   ============================================================ */

function finishGame() {

  const profile =
    getCurrentProfile();

  profile.sessions++;

  profile.stars += sessionScore;

  const percentage =
    sessionScore / sessionTotal;

  let unlocked = false;

  /*
    Need 70% or better to unlock next level.
  */

  if (
    percentage >= 0.7 &&
    currentLevel === profile.unlockedLevel &&
    profile.unlockedLevel < LEVELS.length
  ) {

    profile.unlockedLevel++;

    unlocked = true;
  }

  saveData();

  $("progressBar").style.width =
    "100%";

  $("finalScore").textContent =
    `${sessionScore} / ${sessionTotal}`;

  if (unlocked) {

    $("resultText").textContent =
      `🌟 You unlocked Level ${
        profile.unlockedLevel
      }!`;

  } else {

    $("resultText").textContent =
      sessionScore === sessionTotal
        ? "Perfect! Amazing animal explorer!"
        : "Wonderful practice! Let's keep learning.";
  }

  $("resultAnimal").textContent =
    sessionScore === sessionTotal
      ? "🏆🦁🎉"
      : "⭐🐼⭐";

  showScreen("result");

  speak(
    unlocked

      ? `Great job! You unlocked level ${
          profile.unlockedLevel
        }!`

      : "Great job! You finished your game!"
  );
}


/* ============================================================
   TRICKY WORD PRACTICE
   ============================================================ */

function practiceWeak() {

  const profile =
    getCurrentProfile();

  const weakWords =
    Object.entries(profile.weak)
      .filter(
        ([, count]) => count > 0
      )
      .map(([word]) => word);

  if (!weakWords.length) {

    toast(
      "No tricky words yet. Great job!"
    );

    return;
  }

  const all = [];

  LEVELS.forEach(level => {

    level.pairs.forEach(pair => {

      if (
        weakWords.includes(pair[0]) ||
        weakWords.includes(pair[1])
      ) {

        all.push({
          word: pair[0],
          answer: pair[1],
          emoji: pair[2],
          answerEmoji: pair[3],
          category: pair[4]
        });

        all.push({
          word: pair[1],
          answer: pair[0],
          emoji: pair[3],
          answerEmoji: pair[2],
          category: pair[4]
        });
      }
    });
  });

  questions =
    chooseSessionQuestions(all);

  questionIndex = 0;
  sessionScore = 0;
  sessionTotal = questions.length;

  currentLevel = 1;

  showScreen("game");

  showQuestion();
}


/* ============================================================
   PARENT AREA
   ============================================================ */

function openParent() {

  if (!data.parentPin) {

    showSetPin();

    return;
  }

  showPinPrompt();
}

function showSetPin() {

  openModal(`
    <h2>👨‍👩‍👧 Parent PIN</h2>

    <p>
      Create a simple 4-digit PIN
      to protect parent settings.
    </p>

    <input
      id="newPin"
      type="password"
      inputmode="numeric"
      maxlength="4"
      placeholder="4 digits">

    <div class="modal-actions">

      <button
        class="secondary"
        onclick="closeModal()">
        Cancel
      </button>

      <button
        class="primary"
        id="savePinBtn">
        Save PIN
      </button>

    </div>
  `);

  $("savePinBtn").onclick = () => {

    const pin =
      $("newPin").value;

    if (!/^\d{4}$/.test(pin)) {

      toast(
        "Please enter 4 numbers."
      );

      return;
    }

    data.parentPin = pin;

    saveData();

    closeModal();

    showParent();
  };
}

function showPinPrompt() {

  pinBuffer = "";

  openModal(`
    <h2>🔐 Parent Area</h2>

    <p>
      Enter your 4-digit PIN.
    </p>

    <div
      class="pin-dots"
      id="pinDots">
      ○ ○ ○ ○
    </div>

    <div class="pin-pad">

      ${
        [1,2,3,4,5,6,7,8,9,"⌫",0,"✓"]
          .map(number => `
            <button
              onclick="pinPress('${number}')">
              ${number}
            </button>
          `)
          .join("")
      }

    </div>

    <div class="modal-actions">

      <button
        class="secondary"
        onclick="closeModal()">
        Cancel
      </button>

    </div>
  `);
}

window.pinPress = function(value) {

  if (value === "⌫") {

    pinBuffer =
      pinBuffer.slice(0, -1);

  } else if (value === "✓") {

    checkPin();

    return;

  } else if (pinBuffer.length < 4) {

    pinBuffer += value;
  }

  $("pinDots").textContent =
    pinBuffer
      .padEnd(4, "○")
      .split("")
      .map(
        (_, index) =>
          index < pinBuffer.length
            ? "●"
            : "○"
      )
      .join(" ");
};

function checkPin() {

  if (pinBuffer === data.parentPin) {

    closeModal();

    showParent();

  } else {

    pinBuffer = "";

    $("pinDots").textContent =
      "○ ○ ○ ○";

    toast(
      "That PIN did not work."
    );
  }
}

function showParent() {

  const profile =
    getCurrentProfile();

  if (!profile) {

    toast(
      "Choose a child profile first."
    );

    showHome();

    return;
  }

  $("parentContent").innerHTML = `

    <div class="stat-grid">

      <div class="stat">
        <div class="number">
          ${profile.stars}
        </div>
        <div class="label">
          Stars
        </div>
      </div>

      <div class="stat">
        <div class="number">
          ${profile.sessions}
        </div>
        <div class="label">
          Sessions
        </div>
      </div>

      <div class="stat">
        <div class="number">
          ${profile.questions}
        </div>
        <div class="label">
          Questions
        </div>
      </div>

      <div class="stat">
        <div class="number">
          ${profile.correct}
        </div>
        <div class="label">
          Correct
        </div>
      </div>

    </div>

    <h3>
      ${profile.avatar}
      ${escapeHTML(profile.name)}
    </h3>

    <div class="level-list">

      ${
        LEVELS.map(level => {

          const stats =
            profile.levelStats[level.id];

          return `
            <div class="level">

              <div class="level-title">
                Level ${level.id}:
                ${stats.played} questions
              </div>

              <div class="level-desc">
                ${stats.correct} correct
              </div>

            </div>
          `;

        }).join("")
      }

    </div>

    <h3>⚙️ Settings</h3>

    <div class="settings">

      <div class="setting-row">

        <label for="sessionLength">
          Questions per game
        </label>

        <select id="sessionLength">

          <option value="3">
            3 — Tiny game
          </option>

          <option value="5">
            5 — Short game
          </option>

          <option value="10">
            10 — Long game
          </option>

        </select>

      </div>

      <div class="setting-row">

        <label>

          <input
            id="reduceMotion"
            type="checkbox">

          Reduce animations

        </label>

      </div>

    </div>

    <h3 style="margin-top:20px">
      💚 Words needing practice
    </h3>

    <div>
      ${renderWeakWords(profile)}
    </div>
  `;

  $("sessionLength").value =
    data.settings.sessionLength;

  $("reduceMotion").checked =
    data.settings.reduceMotion;

  $("sessionLength").onchange =
    event => {

      data.settings.sessionLength =
        Number(event.target.value);

      saveData();
    };

  $("reduceMotion").onchange =
    event => {

      data.settings.reduceMotion =
        event.target.checked;

      document.body.classList.toggle(
        "reduce-motion",
        event.target.checked
      );

      saveData();
    };

  showScreen("parent");
}

function renderWeakWords(profile) {

  const words =
    Object.entries(profile.weak)

      .filter(
        ([, count]) => count > 0
      )

      .sort(
        (a,b) => b[1] - a[1]
      )

      .slice(0,12);

  if (!words.length) {

    return `
      <p>
        🌟 No tricky words yet!
      </p>
    `;
  }

  return `
    <div class="level-list">

      ${
        words.map(
          ([word,count]) => `
            <div class="level">

              <strong>
                ${escapeHTML(word)}
              </strong>

              <span class="small">
                needs ${count}
                more practice turn(s)
              </span>

            </div>
          `
        ).join("")
      }

    </div>
  `;
}


/* ============================================================
   MODALS
   ============================================================ */

function openModal(html) {

  $("modalBox").innerHTML = html;

  $("modal")
    .classList
    .remove("hidden");
}

function closeModal() {

  $("modal")
    .classList
    .add("hidden");
}

window.closeModal = closeModal;


/* ============================================================
   SPEECH
   ============================================================ */

function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }

  stopSpeaking();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.rate =
    Number(data.settings.speechRate) || 0.78;

  utterance.pitch = 1.15;
  utterance.volume = 1;

  const voices =
    window.speechSynthesis.getVoices();

  const english =
    voices.find(
      voice =>
        /^en(-|_)/i.test(
          voice.lang
        )
    );

  if (english) {
    utterance.voice = english;
  }

  window.speechSynthesis.speak(
    utterance
  );
}

function stopSpeaking() {

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  clearTimeout(speechTimer);
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function showScreen(name) {

  Object.values(screens)
    .forEach(screen =>
      screen.classList.add("hidden")
    );

  screens[name]
    .classList
    .remove("hidden");

  window.scrollTo(0, 0);
}

function showHome() {

  currentProfileId = null;

  renderProfiles();

  showScreen("home");
}


/* ============================================================
   RESET
   ============================================================ */

function resetProgress() {

  openModal(`
    <h2>Reset progress?</h2>

    <p>
      This removes all child profiles
      and saved progress from this device.
    </p>

    <div class="modal-actions">

      <button
        class="secondary"
        onclick="closeModal()">
        Cancel
      </button>

      <button
        class="primary danger"
        id="confirmReset">
        Reset everything
      </button>

    </div>
  `);

  $("confirmReset").onclick = () => {

    localStorage.removeItem(
      STORAGE_KEY
    );

    data = defaultData();

    currentProfileId = null;

    closeModal();

    showHome();

    toast(
      "Progress reset."
    );
  };
}


/* ============================================================
   TOAST
   ============================================================ */

let toastTimer;

function toast(text) {

  const element = $("toast");

  element.textContent = text;

  element.classList.remove(
    "hidden"
  );

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      element.classList.add(
        "hidden"
      );

    }, 2200);
}


/* ============================================================
   HELPERS
   ============================================================ */

function shuffle(array) {

  return [...array].sort(
    () => Math.random() - 0.5
  );
}

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

$("homeBtn").addEventListener(
  "click",
  showHome
);

$("addProfile").addEventListener(
  "click",
  openCreate
);

$("cancelCreate").addEventListener(
  "click",
  showHome
);

$("saveProfile").addEventListener(
  "click",
  saveProfile
);

$("parentHome").addEventListener(
  "click",
  showHome
);

$("parentBtn").addEventListener(
  "click",
  openParent
);

$("practiceWeak").addEventListener(
  "click",
  practiceWeak
);

$("nextButton").addEventListener(
  "click",
  () => {

    questionIndex++;

    showQuestion();
  }
);

$("hearQuestion").addEventListener(
  "click",
  () => {

    if (currentQuestion) {
      speak(
        currentQuestion.word
      );
    }
  }
);

$("playAgain").addEventListener(
  "click",
  () => {
    startGame(currentLevel);
  }
);

$("chooseLevel").addEventListener(
  "click",
  showLevels
);

$("resetProgress").addEventListener(
  "click",
  resetProgress
);


/* ============================================================
   INITIALIZATION
   ============================================================ */

function init() {

  document.body.classList.toggle(
    "reduce-motion",
    data.settings.reduceMotion
  );

  renderProfiles();

  /*
    Browser voices can load asynchronously.
  */

  if ("speechSynthesis" in window) {

    window.speechSynthesis.getVoices();

    window.speechSynthesis.onvoiceschanged =
      () => {
        window.speechSynthesis.getVoices();
      };
  }
}

init();
```
