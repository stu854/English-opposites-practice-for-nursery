/* ============================================================
   ANIMAL OPPOSITES — UPDATED APP LOGIC
   ============================================================ */

const AVATARS = [
  "🐼", "🐨", "🦊", "🐸",
  "🐯", "🐵", "🐰", "🐻"
];

const STORAGE_KEY = "animalOpposites_v4";

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
let speechQueue = [];
let speechQueueRunning = false;

let toastTimer;


/* ============================================================
   DOM
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
   DEFAULT DATA
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


/* ============================================================
   DATA MIGRATION
   ============================================================ */

function normalizeProfile(profile) {

  const normalized = {
    id: profile.id,
    name: profile.name || "Player",
    avatar: profile.avatar || "🐼",

    stars: Number(profile.stars) || 0,

    sessions: Number(profile.sessions) || 0,

    /*
      questions = completed questions.
      attempts = all taps, including wrong tries.
    */

    questions: Number(profile.questions) || 0,
    attempts: Number(profile.attempts) || 0,

    correct: Number(profile.correct) || 0,

    unlockedLevel:
      Math.max(
        1,
        Number(profile.unlockedLevel) || 1
      ),

    weak:
      profile.weak &&
      typeof profile.weak === "object"
        ? profile.weak
        : {},

    levelStats: {}
  };

  for (let i = 1; i <= LEVELS.length; i++) {

    const oldStats =
      profile.levelStats &&
      profile.levelStats[i]
        ? profile.levelStats[i]
        : {};

    normalized.levelStats[i] = {

      played:
        Number(oldStats.played) || 0,

      correct:
        Number(oldStats.correct) || 0,

      attempts:
        Number(oldStats.attempts) || 0
    };
  }

  return normalized;
}


/* ============================================================
   STORAGE
   ============================================================ */

function loadData() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    /*
      Also look for the previous version.
    */

    const oldRaw =
      raw ||
      localStorage.getItem(
        "animalOpposites_v3"
      );

    if (!oldRaw) {

      return defaultData();
    }

    const parsed =
      JSON.parse(oldRaw);

    const defaults =
      defaultData();

    return {

      ...defaults,

      ...parsed,

      profiles:
        Array.isArray(parsed.profiles)
          ? parsed.profiles.map(
              normalizeProfile
            )
          : [],

      settings: {

        ...defaults.settings,

        ...(parsed.settings || {})
      }
    };

  } catch (error) {

    console.warn(
      "Could not load saved progress.",
      error
    );

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

    console.warn(
      "Could not save progress.",
      error
    );
  }
}


function getCurrentProfile() {

  return data.profiles.find(
    profile =>
      profile.id === currentProfileId
  );
}


/* ============================================================
   PROFILE CREATION
   ============================================================ */

function openCreate() {

  showScreen("create");

  $("childName").value = "";

  selectedAvatar =
    AVATARS[0];

  renderAvatarPicker();
}


function renderAvatarPicker() {

  const container =
    $("avatarPicker");

  container.innerHTML = "";

  AVATARS.forEach(avatar => {

    const button =
      document.createElement("button");

    button.className =
      "avatar-choice" +
      (
        avatar === selectedAvatar
          ? " selected"
          : ""
      );

    button.type = "button";

    button.textContent =
      avatar;

    button.addEventListener(
      "click",
      () => {

        selectedAvatar =
          avatar;

        renderAvatarPicker();
      }
    );

    container.appendChild(
      button
    );
  });
}


function saveProfile() {

  const name =
    $("childName").value.trim();

  if (!name) {

    toast(
      "Please choose a nickname."
    );

    return;
  }

  const id =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"

      ? crypto.randomUUID()

      : String(
          Date.now()
        );


  const levelStats = {};

  for (
    let i = 1;
    i <= LEVELS.length;
    i++
  ) {

    levelStats[i] = {
      played: 0,
      correct: 0,
      attempts: 0
    };
  }


  const profile = {

    id,

    name,

    avatar:
      selectedAvatar,

    stars: 0,

    sessions: 0,

    questions: 0,

    attempts: 0,

    correct: 0,

    unlockedLevel: 1,

    weak: {},

    levelStats
  };


  data.profiles.push(
    profile
  );

  currentProfileId =
    profile.id;

  saveData();

  showLevels();
}


/* ============================================================
   HOME
   ============================================================ */

function renderProfiles() {

  const container =
    $("profiles");

  container.innerHTML = "";

  if (!data.profiles.length) {

    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center">
        <p>No child profile yet.</p>
      </div>
    `;

    return;
  }


  data.profiles.forEach(
    profile => {

      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "profile";

      button.innerHTML = `
        <div class="avatar">
          ${profile.avatar}
        </div>

        <div class="name">
          ${escapeHTML(
            profile.name
          )}
        </div>

        <div class="stars">
          ⭐ ${profile.stars}
        </div>
      `;


      button.addEventListener(
        "click",
        () => {

          currentProfileId =
            profile.id;

          showLevels();
        }
      );


      container.appendChild(
        button
      );
    }
  );
}


/* ============================================================
   LEVELS
   ============================================================ */

function showLevels() {

  const profile =
    getCurrentProfile();

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

  const profile =
    getCurrentProfile();

  const container =
    $("levelList");

  container.innerHTML = "";


  LEVELS.forEach(level => {

    const unlocked =
      profile.unlockedLevel >=
      level.id;


    const div =
      document.createElement(
        "div"
      );

    div.className =
      "level " +
      (
        unlocked
          ? "unlocked"
          : "locked"
      );


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
              type="button"
              class="primary"
              data-level="${level.id}">
              Play
            </button>
          `

          : `
            <div class="small">
              Finish the previous level
              to unlock this one.
            </div>
          `
      }
    `;


    if (unlocked) {

      div
        .querySelector("button")
        .addEventListener(
          "click",
          () => {

            startGame(
              level.id
            );
          }
        );
    }


    container.appendChild(
      div
    );
  });
}


/* ============================================================
   PAIRS
   ============================================================ */

function getPairsForLevel(
  levelId
) {

  const level =
    LEVELS.find(
      level =>
        level.id === levelId
    );

  return level
    ? level.pairs
    : [];
}


/* ============================================================
   QUESTION CREATION
   ============================================================ */

function makeQuestions(
  levelId,
  weakOnly = false
) {

  let pairs = [];

  const profile =
    getCurrentProfile();


  if (weakOnly && profile) {

    LEVELS.forEach(
      level => {

        level.pairs.forEach(
          pair => {

            const first =
              pair[0];

            const second =
              pair[1];


            if (
              getWeakScore(
                first,
                second
              ) > 0
            ) {

              pairs.push(
                pair
              );
            }
          }
        );
      }
    );


    if (!pairs.length) {

      weakOnly = false;
    }
  }


  if (!weakOnly) {

    pairs =
      getPairsForLevel(
        levelId
      );
  }


  const result = [];


  pairs.forEach(
    pair => {

      /*
        BIG → SMALL
      */

      result.push({

        word:
          pair[0],

        answer:
          pair[1],

        emoji:
          pair[2],

        answerEmoji:
          pair[3],

        category:
          pair[4]
      });


      /*
        SMALL → BIG
      */

      result.push({

        word:
          pair[1],

        answer:
          pair[0],

        emoji:
          pair[3],

        answerEmoji:
          pair[2],

        category:
          pair[4]
      });
    }
  );


  return shuffle(
    result
  );
}


/* ============================================================
   WEAK WORDS
   ============================================================ */

function weakKey(
  word,
  answer
) {

  return (
    `${word}→${answer}`
      .toLowerCase()
  );
}


function getWeakScore(
  word,
  answer
) {

  const profile =
    getCurrentProfile();

  if (!profile) {
    return 0;
  }


  /*
    New format:
    word → answer
  */

  const directionKey =
    weakKey(
      word,
      answer
    );


  if (
    typeof profile.weak[
      directionKey
    ] === "number"
  ) {

    return profile.weak[
      directionKey
    ];
  }


  /*
    Old format fallback.
  */

  return Number(
    profile.weak[word]
  ) || 0;
}


function increaseWeakScore(
  word,
  answer
) {

  const profile =
    getCurrentProfile();

  if (!profile) {
    return;
  }

  const key =
    weakKey(
      word,
      answer
    );

  profile.weak[key] =
    getWeakScore(
      word,
      answer
    ) + 2;
}


function decreaseWeakScore(
  word,
  answer
) {

  const profile =
    getCurrentProfile();

  if (!profile) {
    return;
  }

  const key =
    weakKey(
      word,
      answer
    );

  profile.weak[key] =
    Math.max(
      0,
      getWeakScore(
        word,
        answer
      ) - 1
    );
}


/* ============================================================
   SESSION SELECTION
   ============================================================ */

function chooseSessionQuestions(
  allQuestions
) {

  const desired =
    Number(
      data.settings.sessionLength
    ) || 5;


  if (
    allQuestions.length <=
    desired
  ) {

    return shuffle(
      allQuestions
    );
  }


  const profile =
    getCurrentProfile();


  const weighted =
    [...allQuestions]
      .sort(
        (a, b) => {

          const bScore =
            profile
              ? getWeakScore(
                  b.word,
                  b.answer
                )
              : 0;

          const aScore =
            profile
              ? getWeakScore(
                  a.word,
                  a.answer
                )
              : 0;

          return bScore - aScore;
        }
      );


  const priorityCount =
    Math.min(
      Math.ceil(
        desired / 2
      ),
      weighted.length
    );


  const priority =
    weighted.slice(
      0,
      priorityCount
    );


  const remaining =
    shuffle(
      weighted.slice(
        priorityCount
      )
    );


  return shuffle([
    ...priority,

    ...remaining.slice(
      0,
      desired -
        priority.length
    )
  ]);
}


/* ============================================================
   START GAME
   ============================================================ */

function startGame(
  levelId,
  weakOnly = false
) {

  const profile =
    getCurrentProfile();

  if (!profile) {

    showHome();

    return;
  }


  currentLevel =
    levelId;


  const allQuestions =
    makeQuestions(
      levelId,
      weakOnly
    );


  questions =
    chooseSessionQuestions(
      allQuestions
    );


  if (!questions.length) {

    toast(
      "No words need extra practice yet!"
    );

    return;
  }


  questionIndex = 0;

  sessionScore = 0;

  sessionTotal =
    questions.length;

  answered = false;


  $("levelBadge").textContent =
    `Level ${levelId}`;

  $("gameScore").textContent =
    "0";

  showScreen("game");

  showQuestion();
}


/* ============================================================
   SHOW QUESTION
   ============================================================ */

function showQuestion() {

  stopSpeech();

  if (
    questionIndex >=
    questions.length
  ) {

    finishGame();

    return;
  }


  currentQuestion =
    questions[
      questionIndex
    ];

  answered = false;


  $("message").textContent =
    "";

  $("nextButton").style.display =
    "none";


  const question =
    currentQuestion;


  $("questionEmoji").textContent =
    question.emoji;


  $("questionWord").textContent =
    question.word.toUpperCase();


  $("instruction").textContent =
    `Find the opposite of ${
      question.word.toUpperCase()
    }!`;


  const progress =
    (
      questionIndex /
      questions.length
    ) * 100;


  $("progressBar").style.width =
    `${progress}%`;


  renderChoices(
    question
  );


  /*
    Give the child a tiny pause
    before speaking.
  */

  speechTimer =
    setTimeout(
      () => {

        playQuestionSpeech(
          question
        );

      },
      450
    );
}


/* ============================================================
   AUTOMATIC SPEECH
   ============================================================ */

function playQuestionSpeech(
  question
) {

  stopSpeech();


  const labels =
    [
      question.word,

      ...[
        ...document
          .querySelectorAll(
            ".choice .word"
          )
      ].map(
        element =>
          element.textContent
      )
    ];


  speakSequence(
    labels,
    750
  );
}


function speakSequence(
  texts,
  gap = 750
) {

  stopSpeech();

  speechQueue =
    texts.filter(
      text =>
        String(text).trim()
    );

  speechQueueRunning =
    false;

  runSpeechQueue(
    gap
  );
}


function runSpeechQueue(
  gap
) {

  if (
    speechQueueRunning
  ) {
    return;
  }


  if (
    !speechQueue.length
  ) {

    speechQueueRunning =
      false;

    return;
  }


  if (
    !("speechSynthesis" in window)
  ) {

    speechQueue = [];

    return;
  }


  speechQueueRunning =
    true;


  const text =
    speechQueue.shift();


  const utterance =
    createUtterance(
      text
    );


  utterance.onend =
    () => {

      speechQueueRunning =
        false;


      if (
        speechQueue.length
      ) {

        speechTimer =
          setTimeout(
            () => {

              runSpeechQueue(
                gap
              );

            },
            gap
          );
      }
    };


  utterance.onerror =
    () => {

      speechQueueRunning =
        false;

      runSpeechQueue(
        gap
      );
    };


  window.speechSynthesis
    .speak(
      utterance
    );
}


function createUtterance(
  text
) {

  const utterance =
    new SpeechSynthesisUtterance(
      String(text)
    );


  utterance.rate =
    Number(
      data.settings.speechRate
    ) || 0.78;


  utterance.pitch =
    1.15;

  utterance.volume =
    1;


  const voices =
    window.speechSynthesis
      .getVoices();


  const english =
    voices.find(
      voice =>
        /^en(-|_)/i.test(
          voice.lang
        )
    );


  if (english) {

    utterance.voice =
      english;
  }


  return utterance;
}


function speak(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;
  }


  stopSpeech();


  window.speechSynthesis
    .speak(
      createUtterance(
        text
      )
    );
}


function stopSpeech() {

  clearTimeout(
    speechTimer
  );


  speechQueue = [];

  speechQueueRunning =
    false;


  if (
    "speechSynthesis" in
    window
      ) {

    window.speechSynthesis
      .cancel();
  }
}


/* ============================================================
   ANSWER CHOICES
   ============================================================ */

function renderChoices(
  question
) {

  const options =
    shuffle([
      question.answer,

      ...getDistractors(
        question.answer,
        question.word
      )
    ]);


  const container =
    $("choices");

  container.innerHTML =
    "";


  options.forEach(
    option => {

      const pair =
        findPairForWord(
          option
        );


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "choice";


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

          answerQuestion(
            button,
            option
          );
        }
      );


      container.appendChild(
        button
      );
    }
  );
}


function getDistractors(
  correctAnswer,
  currentWord
) {

  const words = [];


  LEVELS.forEach(
    level => {

      level.pairs.forEach(
        pair => {

          pair
            .slice(0, 2)
            .forEach(
              word => {

                if (
                  word !==
                    correctAnswer &&

                  word !==
                    currentWord &&

                  !words.includes(
                    word
                  )
                ) {

                  words.push(
                    word
                  );
                }
              }
            );
        }
      );
    }
  );


  return shuffle(
    words
  ).slice(0, 2);
}


function findPairForWord(
  word
) {

  for (
    const level
    of LEVELS
  ) {

    for (
      const pair
      of level.pairs
    ) {

      if (
        pair[0] === word
      ) {

        return {
          word,
          emoji: pair[2]
        };
      }


      if (
        pair[1] === word
      ) {

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

  if (answered) {
    return;
  }


  const profile =
    getCurrentProfile();


  const question =
    currentQuestion;


  if (!profile || !question) {
    return;
  }


  /*
    Every tap is an attempt.
  */

  profile.attempts++;


  if (
    !profile.levelStats[
      currentLevel
    ]
  ) {

    profile.levelStats[
      currentLevel
    ] = {
      played: 0,
      correct: 0,
      attempts: 0
    };
  }


  profile.levelStats[
    currentLevel
  ].attempts++;


  /*
    Correct answer.
  */

  if (
    selected ===
    question.answer
  ) {

    answered =
      true;


    sessionScore++;


    /*
      One completed question.
    */

    profile.questions++;


    profile.correct++;


    profile.levelStats[
      currentLevel
    ].played++;


    profile.levelStats[
      currentLevel
    ].correct++;


    decreaseWeakScore(
      question.word,
      question.answer
    );


    button.classList.add(
      "correct"
    );


    document
      .querySelectorAll(
        ".choice"
      )
      .forEach(
        choice => {
          choice.disabled =
            true;
        }
      );


    const praise =
      PRAISE[
        Math.floor(
          Math.random() *
          PRAISE.length
        )
      ];


    const text =
      `${praise} ${
        question.word
      } and ${
        question.answer
      } are opposites!`;


    $("message").textContent =
      text;


    $("gameScore").textContent =
      sessionScore;


    /*
      Speak the feedback once.
    */

    speak(
      text
    );


    $("nextButton")
      .style.display =
      "block";


    saveData();


    return;
  }


  /*
    Wrong answer:
    Do NOT mark the question complete.
    The child gets another chance.
  */

  button.classList.add(
    "wrong"
  );


  increaseWeakScore(
    question.word,
    question.answer
  );


  $("message").textContent =
    "Almost! Try another one. 🐾";


  speak(
    "Almost. Try another one."
  );


  saveData();


  setTimeout(
    () => {

      button.classList.remove(
        "wrong"
      );

    },
    500
  );
}


/* ============================================================
   FINISH GAME
   ============================================================ */

function finishGame() {

  const profile =
    getCurrentProfile();


  if (!profile) {

    showHome();

    return;
  }


  profile.sessions++;


  profile.stars +=
    sessionScore;


  const percentage =
    sessionTotal > 0

      ? sessionScore /
        sessionTotal

      : 0;


  let unlocked =
    false;


  /*
    Need 70% or better
    to unlock the next level.
  */

  if (

    percentage >= 0.7 &&

    currentLevel ===
      profile.unlockedLevel &&

    profile.unlockedLevel <
      LEVELS.length

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

      sessionScore ===
        sessionTotal

        ? "Perfect! Amazing animal explorer!"

        : "Wonderful practice! Let's keep learning.";
  }


  $("resultAnimal").textContent =
    sessionScore ===
      sessionTotal

      ? "🏆"

      : "🦁";


  showScreen(
    "result"
  );


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


  if (!profile) {
    return;
  }


  const weakQuestions = [];


  LEVELS.forEach(
    level => {

      level.pairs.forEach(
        pair => {

          const first =
            pair[0];

          const second =
            pair[1];


          if (
            getWeakScore(
              first,
              second
            ) > 0
          ) {

            weakQuestions.push({

              word: first,
              answer: second,
              emoji: pair[2],
              answerEmoji: pair[3],
              category: pair[4]
            });
          }


          if (
            getWeakScore(
              second,
              first
            ) > 0
          ) {

            weakQuestions.push({

              word: second,
              answer: first,
              emoji: pair[3],
              answerEmoji: pair[2],
              category: pair[4]
            });
          }
        }
      );
    }
  );


  if (!weakQuestions.length) {

    toast(
      "No tricky words yet. Great job!"
    );

    return;
  }


  questions =
    chooseSessionQuestions(
      weakQuestions
    );


  questionIndex = 0;

  sessionScore = 0;

  sessionTotal =
    questions.length;


  /*
    This is practice, not a normal level.
  */

  currentLevel =
    1;


  showScreen(
    "game"
  );


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

    <h2>
      👨‍👩‍👧 Parent PIN
    </h2>

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


  $("savePinBtn").onclick =
    () => {

      const pin =
        $("newPin").value;


      if (
        !/^\d{4}$/.test(
          pin
        )
      ) {

        toast(
          "Please enter 4 numbers."
        );

        return;
      }


      data.parentPin =
        pin;


      saveData();

      closeModal();

      showParent();
    };
}


function showPinPrompt() {

  pinBuffer =
    "";


  openModal(`

    <h2>
      🔐 Parent Area
    </h2>

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
        [
          1,2,3,
          4,5,6,
          7,8,9,
          "⌫",0,"✓"
        ]

        .map(
          number => `

            <button
              type="button"
              onclick="pinPress('${number}')">
              ${number}
            </button>

          `
        )

        .join("")
      }

    </div>

  `);
}


function pinPress(
  value
) {

  if (
    value ===
    "⌫"
  ) {

    pinBuffer =
      pinBuffer.slice(
        0,
        -1
      );

    updatePinDots();

    return;
  }


  if (
    value ===
    "✓"
  ) {

    checkPin();

    return;
  }


  if (
    pinBuffer.length >= 4
  ) {

    return;
  }


  pinBuffer +=
    String(value);


  updatePinDots();


  if (
    pinBuffer.length === 4
  ) {

    setTimeout(
      checkPin,
      150
    );
  }
}


window.pinPress =
  pinPress;


function updatePinDots() {

  const dots =
    $("pinDots");


  if (!dots) {
    return;
  }


  dots.textContent =
    [0,1,2,3]
      .map(
        index =>
          index <
          pinBuffer.length
            ? "●"
            : "○"
      )
      .join(" ");
}


function checkPin() {

  if (
    pinBuffer ===
    data.parentPin
  ) {

    closeModal();

    showParent();

    return;
  }


  pinBuffer =
    "";

  updatePinDots();

  toast(
    "That PIN is not correct."
  );
}


/* ============================================================
   PARENT DASHBOARD
   ============================================================ */

function showParent() {

  const profile =
    getCurrentProfile();


  if (!profile) {

    toast(
      "Choose a player first."
    );

    showHome();

    return;
  }


  const totalQuestions =
    profile.questions;


  const accuracy =
    totalQuestions > 0

      ? Math.round(
          (
            profile.correct /
            totalQuestions
          ) * 100
        )

      : 0;


  $("parentContent")
    .innerHTML = `

      <div class="stat-grid">

        <div class="stat">

          <div class="number">
            ⭐ ${profile.stars}
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
            Games
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
            ${accuracy}%
          </div>

          <div class="label">
            Accuracy
          </div>

        </div>

      </div>


      <h3>
        ${profile.avatar}
        ${escapeHTML(
          profile.name
        )}
      </h3>


      <div class="level-list">

        ${
          LEVELS.map(
            level => {

              const stats =
                profile.levelStats[
                  level.id
                ] || {
                  played: 0,
                  correct: 0,
                  attempts: 0
                };


              const levelAccuracy =
                stats.played > 0

                  ? Math.round(
                      (
                        stats.correct /
                        stats.played
                      ) * 100
                    )

                  : 0;


              return `

                <div class="level">

                  <div class="level-title">

                    Level ${level.id}

                  </div>

                  <div class="level-desc">

                    ${stats.played}
                    completed questions

                    ·

                    ${stats.correct}
                    correct

                    ·

                    ${levelAccuracy}%
                    accuracy

                  </div>

                </div>

              `;
            }
          ).join("")
        }

      </div>


      <h3>
        ⚙️ Settings
      </h3>


      <div class="settings">

        <div class="setting-row">

          <label
            for="sessionLength">

            Questions per game

          </label>


          <select
            id="sessionLength">

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

        ${renderWeakWords(
          profile
        )}

      </div>

    `;


  $("sessionLength").value =
    data.settings.sessionLength;


  $("reduceMotion").checked =
    data.settings.reduceMotion;


  $("sessionLength").onchange =
    event => {

      data.settings.sessionLength =
        Number(
          event.target.value
        );

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


  showScreen(
    "parent"
  );
}


function renderWeakWords(
  profile
) {

  const entries =
    Object.entries(
      profile.weak
    )
      .filter(
        ([, count]) =>
          Number(count) > 0
      )
      .sort(
        (a, b) =>
          Number(b[1]) -
          Number(a[1])
      )
      .slice(
        0,
        12
      );


  if (!entries.length) {

    return `
      <p>
        🌟 No tricky words yet!
      </p>
    `;
  }


  return `

    <div class="level-list">

      ${
        entries.map(
          ([key, count]) => `

            <div class="level">

              <strong>
                ${escapeHTML(
                  key
                )}
              </strong>

              <span class="small">
                needs ${count}
                more practice
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

function openModal(
  html
) {

  $("modalBox")
    .innerHTML =
    html;


  $("modal")
    .classList
    .remove(
      "hidden"
    );
}


function closeModal() {

  $("modal")
    .classList
    .add(
      "hidden"
    );

  stopSpeech();
}


window.closeModal =
  closeModal;


/* ============================================================
   NAVIGATION
   ============================================================ */

function showScreen(
  name
) {

  Object.values(
    screens
  ).forEach(
    screen => {

      screen.classList.add(
        "hidden"
      );
    }
  );


  if (
    screens[name]
  ) {

    screens[name]
      .classList
      .remove(
        "hidden"
      );
  }


  window.scrollTo(
    0,
    0
  );
}


function showHome() {

  stopSpeech();

  currentProfileId =
    null;


  questions = [];

  currentQuestion =
    null;


  renderProfiles();

  showScreen(
    "home"
  );
}


/* ============================================================
   RESET
   ============================================================ */

function resetProgress() {

  openModal(`

    <h2>
      Reset progress?
    </h2>

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


  $("confirmReset").onclick =
    () => {

      localStorage.removeItem(
        STORAGE_KEY
      );

      localStorage.removeItem(
        "animalOpposites_v3"
      );


      data =
        defaultData();


      currentProfileId =
        null;


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

function toast(
  text
) {

  const element =
    $("toast");


  element.textContent =
    text;


  element.classList.remove(
    "hidden"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        element.classList.add(
          "hidden"
        );

      },
      2200
    );
}


/* ============================================================
   HELPERS
   ============================================================ */

function shuffle(
  array
) {

  /*
    Fisher-Yates shuffle.
    Better than sort(() => Math.random() - 0.5).
  */

  const result =
    [...array];


  for (
    let i =
      result.length - 1;

    i > 0;

    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }


  return result;
}


function escapeHTML(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

$("homeBtn")
  .addEventListener(
    "click",
    showHome
  );


$("addProfile")
  .addEventListener(
    "click",
    openCreate
  );


$("cancelCreate")
  .addEventListener(
    "click",
    showHome
  );


$("saveProfile")
  .addEventListener(
    "click",
    saveProfile
  );


/*
  IMPORTANT:
  There is intentionally NO backHome
  listener here.

  Your current index.html does not
  contain an element with id="backHome".
*/


$("parentHome")
  .addEventListener(
    "click",
    showHome
  );


$("parentBtn")
  .addEventListener(
    "click",
    openParent
  );


$("practiceWeak")
  .addEventListener(
    "click",
    practiceWeak
  );


$("nextButton")
  .addEventListener(
    "click",
    () => {

      if (!answered) {
        return;
      }


      questionIndex++;

      showQuestion();
    }
  );


$("hearQuestion")
  .addEventListener(
    "click",
    () => {

      if (
        currentQuestion
      ) {

        speak(
          currentQuestion.word
        );
      }
    }
  );


$("playAgain")
  .addEventListener(
    "click",
    () => {

      startGame(
        currentLevel
      );
    }
  );


$("chooseLevel")
  .addEventListener(
    "click",
    showLevels
  );


$("resetProgress")
  .addEventListener(
    "click",
    resetProgress
  );


/* ============================================================
   INITIALIZATION
   ============================================================ */

function init() {

  document.body.classList.toggle(
    "reduce-motion",
    Boolean(
      data.settings.reduceMotion
    )
  );


  renderProfiles();


  /*
    Browser voices often load later.
  */

  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis
      .getVoices();


    window.speechSynthesis
      .onvoiceschanged =
      () => {

        window.speechSynthesis
          .getVoices();
      };
  }
}


init();
