(function () {
  const app = document.getElementById("app");
  const subjects = [
    ["Pédiatrie", "👶"],
    ["Santé publique", "🌍"],
    ["Médecine", "🩺"],
    ["Chirurgie", "🏥"],
    ["Gynécologie", "♀"],
    ["Planification familiale / SR", "🤝"],
  ];
  const state = {
    unlocked: false,
    code: "",
    studentName: "",
    subject: "",
    exam: null,
    index: 0,
    answers: {},
    submitted: false,
    correction: false,
    error: "",
    seconds: 30,
    timer: null,
    resultSaved: false,
  };
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
          char
        ],
    );
  const keys = (answer) => [
    ...new Set(
      (answer || "")
        .split("(")[0]
        .toUpperCase()
        .match(/\b[A-F]\b/g) || [],
    ),
  ];
  const picked = (index) => state.answers[index] || [];
  const storageKey = () => `revision-history-${state.code}`;

  function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }
  function set(html) {
    stopTimer();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  function studentFor(code) {
    return window.STUDENT_NAMES?.[code] || `Étudiant ${code}`;
  }
  function history() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || "[]");
    } catch (_) {
      return [];
    }
  }
  function saveHistory(result) {
    if (state.resultSaved) return;
    const items = history();
    items.unshift({
      examId: state.exam.id,
      subject: state.exam.subject,
      antenna: state.exam.antenna,
      points: result.points,
      correct: result.correct,
      total: result.total,
      date: new Date().toISOString(),
    });
    localStorage.setItem(storageKey(), JSON.stringify(items.slice(0, 50)));
    state.resultSaved = true;
  }
  function login() {
    const value = document.getElementById("code").value.trim().toUpperCase();
    if (window.ACCESS_CODES.some((code) => code.toUpperCase() === value)) {
      Object.assign(state, {
        unlocked: true,
        code: value,
        studentName: studentFor(value),
        error: "",
      });
      renderHome();
    } else {
      state.error = "Code d’accès invalide. Vérifiez le code reçu puis réessayez.";
      renderLogin();
    }
  }
  function logout() {
    Object.assign(state, {
      unlocked: false,
      code: "",
      studentName: "",
      subject: "",
      exam: null,
      index: 0,
      answers: {},
      submitted: false,
      correction: false,
      error: "",
      resultSaved: false,
    });
    renderLogin();
  }
  function renderLogin() {
    set(`<section class="center"><article class="card login"><header class="hero"><div class="logo">RA</div><div class="eyebrow">Plateforme de révision</div><h1>AUXILIAIRES DE SANTÉ</h1><p>Saisissez votre code personnel pour accéder aux matières et aux sujets.</p></header><div class="body"><form id="login"><label class="label" for="code">Code d’accès</label><input class="input" id="code" required placeholder="Ex. XX000" autocomplete="one-time-code">${state.error ? `<div class="error">${esc(state.error)}</div>` : ""}<button class="btn wide">Accéder au portail</button></form><div class="note">L’accès est réservé aux étudiants autorisés.<br><b>Votre code est personnel. Ne le partagez pas.</b></div></div></article></section>`);
    document.getElementById("login").onsubmit = (event) => {
      event.preventDefault();
      login();
    };
  }
  function historyPanel() {
    const items = history();
    if (!items.length)
      return '<section class="panel"><h2>Ma progression</h2><p>Aucun résultat enregistré pour le moment.</p></section>';
    return `<section class="panel"><h2>Ma progression</h2><div class="history">${items
      .map(
        (item) =>
          `<div class="history-row"><span><b>DEB 2025 • ${esc(item.subject)}</b><small>Antenne de ${esc(item.antenna)} • ${new Date(item.date).toLocaleString("fr-FR")}</small></span><strong>${item.points ?? item.score} pt${Math.abs(item.points ?? item.score) > 1 ? "s" : ""}</strong></div>`,
      )
      .join("")}</div></section>`;
  }
  function renderHome() {
    const list = subjects
      .map(([name, icon]) => {
        const count = window.EXAMS.filter((exam) => exam.subject === name).length;
        return `<button class="banner" data-subject="${esc(name)}"><span class="icon">${icon}</span><span class="grow"><b>${esc(name)}</b><small>${count ? `${count} sujet${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}` : "Aucun sujet disponible"}</small></span><span class="arrow">›</span></button>`;
      })
      .join("");
    set(`<header class="top"><button id="logout" class="btn secondary logout-top">Déconnexion</button><div class="logo">RA</div><div class="eyebrow">Espace étudiant</div><h1>${esc(state.studentName)}</h1><p>Code : ${esc(state.code)} • Portail de révision des Auxiliaires de Santé</p></header><div class="wrap"><section class="intro"><div class="eyebrow" style="color:#0e7490">Première étape</div><h2>Choisissez une matière</h2><p>Vous accéderez ensuite à une page présentant uniquement les sujets de cette matière.</p></section>${list}${historyPanel()}</div>`);
    document.getElementById("logout").onclick = logout;
    document.querySelectorAll("[data-subject]").forEach((button) => {
      button.onclick = () => {
        state.subject = button.dataset.subject;
        renderSubjects();
      };
    });
  }
  function renderSubjects() {
    const exams = window.EXAMS.filter((exam) => exam.subject === state.subject);
    const list = exams.length
      ? exams
          .map(
            (exam, index) =>
              `<button class="exam" data-exam="${esc(exam.id)}"><span class="num">${index + 1}</span><span class="grow"><b>Sujet DEB 2025 — Antenne de ${esc(exam.antenna)}</b><small>${exam.questions.length} questions • 30 secondes par question</small></span><b>Commencer →</b></button>`,
          )
          .join("")
      : "<p>Aucun sujet de cette matière dans le document reçu.</p>";
    set(`<header class="top"><button id="logout" class="btn secondary logout-top">Déconnexion</button><div class="logo">RA</div><div class="eyebrow">DEB 2025</div><h1>${esc(state.subject)}</h1><p>${esc(state.studentName)} • Code ${esc(state.code)}</p></header><div class="wrap"><button id="home" class="btn secondary">← Retour aux matières</button><section class="panel subjects-page"><div class="eyebrow" style="color:#0e7490">Deuxième étape</div><h2>Choisissez un sujet</h2><p>Barème : bonne réponse +1, mauvaise réponse −1, aucune réponse 0.</p>${list}</section></div>`);
    document.getElementById("logout").onclick = logout;
    document.getElementById("home").onclick = () => {
      state.subject = "";
      renderHome();
    };
    document.querySelectorAll("[data-exam]").forEach((button) => {
      button.onclick = () => {
        Object.assign(state, {
          exam: window.EXAMS.find((exam) => exam.id === button.dataset.exam),
          index: 0,
          answers: {},
          submitted: false,
          correction: false,
          error: "",
          resultSaved: false,
        });
        renderQuiz();
      };
    });
  }
  function result() {
    const answerable = state.exam.questions
      .map((question, index) => ({ question, index }))
      .filter((item) => item.question.options.length);
    const correct = answerable.filter(({ question, index }) => {
      const answer = keys(question.answer);
      const selected = picked(index);
      return (
        answer.length &&
        answer.length === selected.length &&
        answer.every((key) => selected.includes(key))
      );
    }).length;
    const unanswered = answerable.filter(({ index }) => !picked(index).length).length;
    const wrong = answerable.length - correct - unanswered;
    return {
      total: answerable.length,
      correct,
      wrong,
      unanswered,
      points: correct - wrong,
    };
  }
  function startTimer() {
    const value = document.getElementById("timer-value");
    const ring = document.getElementById("timer-ring");
    state.seconds = 30;
    state.timer = setInterval(() => {
      state.seconds -= 1;
      if (value) value.textContent = state.seconds;
      if (ring) ring.style.width = `${(state.seconds / 30) * 100}%`;
      if (state.seconds <= 0) {
        stopTimer();
        if (state.index < state.exam.questions.length - 1) {
          state.index += 1;
          renderQuiz();
        } else {
          state.submitted = true;
          renderResult();
        }
      }
    }, 1000);
  }
  function renderQuiz() {
    if (state.submitted)
      return state.correction ? renderCorrection() : renderResult();
    const exam = state.exam;
    const question = exam.questions[state.index];
    const selected = picked(state.index);
    const correctKeys = keys(question.answer);
    const multiple = correctKeys.length > 1;
    set(`<div class="quiz"><div class="topline wrap" style="padding:0 0 14px"><button id="back" class="btn secondary">← Retour aux sujets</button><button id="logout" class="btn secondary">Déconnexion</button></div><article class="card" style="margin:auto"><header class="hero" style="text-align:left"><div class="eyebrow">DEB 2025 • ${esc(exam.subject)} • Antenne de ${esc(exam.antenna)} • ${esc(state.studentName)}</div><div class="topline"><h2>Question ${state.index + 1} / ${exam.questions.length}</h2><div class="timer"><b><span id="timer-value">30</span> s</b><div><i id="timer-ring"></i></div></div></div><div class="progress"><i style="width:${((state.index + 1) * 100) / exam.questions.length}%"></i></div></header><div class="body"><p class="question-type">${multiple ? `${correctKeys.length} réponses attendues` : "Une seule réponse attendue"}</p><div class="question">${esc(question.prompt)}</div><div>${question.options
      .map(
        (option) =>
          `<button class="option ${selected.includes(option.key) ? "chosen" : ""}" data-key="${esc(option.key)}"><span class="key">${esc(option.key)}</span><span>${esc(option.text)}</span>${selected.includes(option.key) ? '<span class="saved">Enregistrée</span>' : ""}</button>`,
      )
      .join("")}</div><div class="actions"><button id="prev" class="btn secondary" ${state.index === 0 ? "disabled" : ""}>← Précédente</button>${state.index < exam.questions.length - 1 ? '<button id="next" class="btn">Question suivante →</button>' : '<button id="submit" class="btn success">Terminer et envoyer</button>'}</div></div></article></div>`);
    document.getElementById("back").onclick = () => {
      state.exam = null;
      renderSubjects();
    };
    document.getElementById("logout").onclick = logout;
    document.querySelectorAll("[data-key]").forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.key;
        const current = picked(state.index);
        state.answers[state.index] = multiple
          ? current.includes(key)
            ? current.filter((item) => item !== key)
            : [...current, key].slice(0, correctKeys.length)
          : [key];
        const updated = picked(state.index);
        document.querySelectorAll("[data-key]").forEach((optionButton) => {
          const isSelected = updated.includes(optionButton.dataset.key);
          optionButton.classList.toggle("chosen", isSelected);
          const saved = optionButton.querySelector(".saved");
          if (isSelected && !saved) {
            optionButton.insertAdjacentHTML(
              "beforeend",
              '<span class="saved">Enregistrée</span>',
            );
          } else if (!isSelected && saved) {
            saved.remove();
          }
        });
      };
    });
    const previous = document.getElementById("prev");
    if (previous)
      previous.onclick = () => {
        if (state.index) {
          state.index -= 1;
          renderQuiz();
        }
      };
    const next = document.getElementById("next");
    if (next)
      next.onclick = () => {
        state.index += 1;
        renderQuiz();
      };
    const submit = document.getElementById("submit");
    if (submit)
      submit.onclick = () => {
        if (
          confirm(
            "Terminer l’épreuve ? Les questions non répondues rapporteront 0 point.",
          )
        ) {
          state.submitted = true;
          renderResult();
        }
      };
    startTimer();
  }
  function renderResult() {
    const resultData = result();
    const exam = state.exam;
    saveHistory(resultData);
    set(`<section class="center"><article class="card"><header class="hero"><div class="eyebrow">DEB 2025 • ${esc(exam.subject)} • Antenne de ${esc(exam.antenna)}</div><h1>Résultat de ${esc(state.studentName)}</h1></header><div class="body"><div class="score"><span>Votre score</span><strong>${resultData.points} point${Math.abs(resultData.points) > 1 ? "s" : ""}</strong><b>${resultData.correct} bonne(s) • ${resultData.wrong} mauvaise(s) • ${resultData.unanswered} non répondue(s)</b><p>Barème : +1 / −1 / 0</p></div><div class="actions" style="justify-content:center;margin-top:22px"><button id="correction" class="btn">Voir la correction</button><button id="home" class="btn secondary">ACCUEIL</button><button id="subjects" class="btn secondary">Retour aux sujets</button></div></div></article></section>`);
    document.getElementById("correction").onclick = () => {
      state.correction = true;
      renderCorrection();
    };
    document.getElementById("home").onclick = () => {
      state.exam = null;
      state.subject = "";
      renderHome();
    };
    document.getElementById("subjects").onclick = () => {
      state.exam = null;
      renderSubjects();
    };
  }
  function renderCorrection() {
    const exam = state.exam;
    set(`<div class="quiz"><article class="card" style="margin:auto"><header class="hero"><div class="eyebrow">DEB 2025 • ${esc(exam.subject)} • Antenne de ${esc(exam.antenna)}</div><h1>Correction de l’épreuve</h1><p>${esc(state.studentName)}</p></header><div class="body"><div class="actions" style="justify-content:center"><button id="result" class="btn">← Retour au résultat</button><button id="home" class="btn secondary">ACCUEIL</button></div>${exam.questions
      .map((question, index) => {
        const answer = keys(question.answer);
        const selected = picked(index);
        const answered = selected.length > 0;
        const correct =
          answer.length &&
          answer.length === selected.length &&
          answer.every((key) => selected.includes(key));
        return `<article class="correction ${correct ? "correct" : "wrong"}"><div class="correction-head"><b>${index + 1}. ${esc(question.prompt)}</b><span class="status ${answered ? "answered" : "unanswered"}">${answered ? "Répondue" : "Non répondue"}</span></div><p><strong>Votre réponse :</strong> ${answered ? esc(selected.join(", ")) : "Non répondue"}</p><p><strong>Bonne réponse :</strong> ${esc(question.answer || "Non précisée")}</p>${question.explanation ? `<p><strong>Explication :</strong> ${esc(question.explanation)}</p>` : ""}</article>`;
      })
      .join("")}</div></article></div>`);
    document.getElementById("result").onclick = () => {
      state.correction = false;
      renderResult();
    };
    document.getElementById("home").onclick = () => {
      state.exam = null;
      state.subject = "";
      renderHome();
    };
  }
  renderLogin();
})();
