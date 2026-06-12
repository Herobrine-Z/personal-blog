(() => {
  "use strict";

  const STORAGE_KEY = "hutao-desktop-pet-v1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const room = document.querySelector("#petRoom");
  const stage = document.querySelector("#petStage");
  const character = document.querySelector("#petCharacter");
  const visual = document.querySelector("#petVisual");
  const shadow = stage.querySelector(".pet-shadow");
  const speech = document.querySelector("#petSpeech");
  const dialogue = document.querySelector("#petDialogue");
  const particleLayer = document.querySelector("#petParticles");
  const actionButtons = [...document.querySelectorAll("[data-action]")];
  const soundToggle = document.querySelector("#soundToggle");
  const motionToggle = document.querySelector("#motionToggle");
  const sceneToggle = document.querySelector("#sceneToggle");
  const dailyGift = document.querySelector("#dailyGift");
  const resetPet = document.querySelector("#resetPet");

  const todayKey = () => {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  };
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
  const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

  const defaultState = {
    hunger: 82,
    mood: 78,
    energy: 84,
    xp: 0,
    coins: 20,
    interactions: 0,
    feeds: 0,
    plays: 0,
    dances: 0,
    pets: 0,
    sleeps: 0,
    bestMood: 78,
    sound: true,
    motion: true,
    night: false,
    firstVisit: Date.now(),
    lastVisit: Date.now(),
    lastGift: "",
    position: { x: 0, y: 0 },
    unlocked: [],
  };

  function loadState() {
    try {
      return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return { ...defaultState };
    }
  }

  const state = loadState();
  state.position = { ...defaultState.position, ...(state.position || {}) };
  state.unlocked = Array.isArray(state.unlocked) ? state.unlocked : [];

  const elapsedHours = Math.min(72, Math.max(0, (Date.now() - Number(state.lastVisit || Date.now())) / 36e5));
  state.hunger = clamp(state.hunger - elapsedHours * 1.7);
  state.mood = clamp(state.mood - elapsedHours * 0.55);
  state.energy = clamp(state.energy + elapsedHours * 1.2);
  state.lastVisit = Date.now();

  const dialogueLines = {
    idle: [
      "你来啦！今天也一起玩吧。",
      "窗外的云慢悠悠的，我们也不用着急。",
      "我有好好待在小屋里，没有乱跑哦。",
      "今天想听你讲点什么？",
      "悄悄告诉你，我刚才数了好多朵桃花。",
    ],
    pet: [
      "嘿嘿，再摸一下也可以。",
      "帽子不会被摸歪的，放心吧。",
      "好暖和……这就是被惦记的感觉吗？",
      "我记住啦，这是今天的摸摸。",
    ],
    feed: [
      "好吃！这一口算你的功劳。",
      "还留了一小块，要不要一起吃？",
      "吃饱了，感觉能绕小屋跑三圈！",
      "点心收到，桃花币也收到啦。",
    ],
    play: [
      "看好啦，我要跳到那边去！",
      "再来一次，我刚刚还没发挥全力。",
      "抓不到我，抓不到我。",
      "呼……玩得好开心！",
    ],
    dance: [
      "锵锵！新年舞狮小桃登场。",
      "左一步，右一步，帽子也要跟上。",
      "这一段只跳给你看。",
    ],
    sleep: [
      "那我眯一小会儿，你别走太远。",
      "午安……醒来还要一起玩。",
      "帽子软软的，刚好可以当枕头。",
    ],
    hungry: [
      "肚子好像在小声抗议……",
      "闻到点心的香味了吗？我也闻到了。",
    ],
    tired: [
      "眼皮有一点点重。",
      "玩了这么久，坐下来歇会儿吧。",
    ],
  };

  const achievementDefinitions = [
    { id: "hello", icon: "初", title: "初次见面", text: "完成第一次互动", test: () => state.interactions >= 1 },
    { id: "gentle", icon: "♡", title: "温柔掌心", text: "摸摸小桃 10 次", test: () => state.pets >= 10 },
    { id: "snack", icon: "食", title: "点心管家", text: "完成 5 次投喂", test: () => state.feeds >= 5 },
    { id: "playmate", icon: "跃", title: "最佳玩伴", text: "玩耍 8 次", test: () => state.plays >= 8 },
    { id: "dancer", icon: "舞", title: "舞狮搭档", text: "一起跳舞 5 次", test: () => state.dances >= 5 },
    { id: "friend", icon: "桃", title: "桃林故友", text: "亲密等级达到 5", test: () => getLevel() >= 5 },
  ];

  let idleTimeline = null;
  let actionTimeline = null;
  let speechTimer = null;
  let audioContext = null;
  let dragging = false;
  let dragMoved = false;
  let pointerStart = null;
  let positionStart = null;
  let actionLocked = false;
  let rig = null;

  function saveState() {
    state.lastVisit = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getLevel() {
    return Math.floor(state.xp / 100) + 1;
  }

  function xpWithinLevel() {
    return Math.floor(state.xp % 100);
  }

  function setSpeech(text, duration = 4200) {
    speech.textContent = text;
    clearTimeout(speechTimer);
    if (window.gsap && !reducedMotion) {
      gsap.fromTo(dialogue, { y: 7, scale: 0.97 }, { y: 0, scale: 1, duration: 0.32, ease: "back.out(1.5)" });
    }
    speechTimer = window.setTimeout(() => {
      const contextual = state.hunger < 28
        ? dialogueLines.hungry
        : state.energy < 22
          ? dialogueLines.tired
          : dialogueLines.idle;
      speech.textContent = randomItem(contextual);
    }, duration);
  }

  function updateClock() {
    const now = new Date();
    const hour = now.getHours();
    document.querySelector("#petClock").textContent = now.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    document.querySelector("#petDayText").textContent =
      hour < 6 ? "夜深啦，小桃还留着一盏灯。" :
      hour < 11 ? "晨光正好，今天也请多关照。" :
      hour < 14 ? "到了吃点心的好时候。" :
      hour < 18 ? "午后适合玩耍，也适合发呆。" :
      hour < 22 ? "晚风进屋了，坐近一点吧。" :
      "该慢慢安静下来，准备休息啦。";
  }

  function updateUI() {
    const stats = ["hunger", "mood", "energy"];
    stats.forEach((name) => {
      const rounded = Math.round(state[name]);
      document.querySelector(`#${name}Value`).textContent = rounded;
      document.querySelector(`#${name}Bar`).style.width = `${rounded}%`;
    });

    document.querySelector("#petLevel").textContent = getLevel();
    document.querySelector("#petCoins").textContent = Math.floor(state.coins);
    document.querySelector("#petXpBar").style.width = `${xpWithinLevel()}%`;
    document.querySelector("#petXpText").textContent = `${xpWithinLevel()} / 100`;
    document.querySelector("#interactionCount").textContent = state.interactions;
    document.querySelector("#bestMood").textContent = Math.round(state.bestMood);
    document.querySelector("#daysTogether").textContent =
      Math.max(1, Math.ceil((Date.now() - Number(state.firstVisit)) / 864e5));
    document.querySelector("#memoryNote").textContent =
      getLevel() >= 5 ? "你们已经很有默契了，小桃看到你就会开心起来。" :
      state.interactions >= 20 ? "小桃开始熟悉你的脚步声，也会等你回来。" :
      state.interactions >= 5 ? "小屋里多了不少共同回忆，再来坐坐吧。" :
      "第一天见面，小桃已经记住你啦。";

    soundToggle.setAttribute("aria-pressed", String(state.sound));
    motionToggle.setAttribute("aria-pressed", String(state.motion));
    room.classList.toggle("is-night", state.night);
    sceneToggle.firstChild.textContent = state.night ? "昼" : "夜";

    const claimed = state.lastGift === todayKey();
    dailyGift.disabled = claimed;
    dailyGift.querySelector("span").textContent = claimed ? "今日已领取" : "今日小礼";
    dailyGift.querySelector("strong").textContent = claimed ? "明天再来看看吧" : "领取 10 枚桃花币";
    renderAchievements();
    saveState();
  }

  function checkAchievements() {
    const newlyUnlocked = achievementDefinitions.filter((item) => item.test() && !state.unlocked.includes(item.id));
    newlyUnlocked.forEach((item) => {
      state.unlocked.push(item.id);
      state.coins += 5;
      window.setTimeout(() => {
        setSpeech(`解锁成就「${item.title}」，还得到 5 枚桃花币！`, 5200);
        burst(["✦", "✿", "成"], 9);
        playSound("reward");
      }, 350);
    });
  }

  function renderAchievements() {
    const container = document.querySelector("#petAchievements");
    container.replaceChildren();
    achievementDefinitions.forEach((item) => {
      const unlocked = state.unlocked.includes(item.id);
      const card = document.createElement("div");
      card.className = `pet-achievement${unlocked ? " unlocked" : ""}`;
      card.innerHTML = `<i>${unlocked ? item.icon : "锁"}</i><strong></strong><span></span>`;
      card.querySelector("strong").textContent = item.title;
      card.querySelector("span").textContent = item.text;
      container.appendChild(card);
    });
    document.querySelector("#achievementCount").textContent =
      `${state.unlocked.length} / ${achievementDefinitions.length}`;
  }

  function addProgress({ hunger = 0, mood = 0, energy = 0, xp = 0, coins = 0 }) {
    state.hunger = clamp(state.hunger + hunger);
    state.mood = clamp(state.mood + mood);
    state.energy = clamp(state.energy + energy);
    state.xp += xp;
    state.coins = Math.max(0, state.coins + coins);
    state.bestMood = Math.max(state.bestMood, state.mood);
    state.interactions += 1;
    checkAchievements();
    updateUI();
  }

  function playSound(type) {
    if (!state.sound) return;
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const notes = {
      pet: [660, 880],
      feed: [440, 660, 880],
      play: [520, 780],
      dance: [392, 523, 659, 784],
      sleep: [440, 330],
      reward: [523, 659, 784, 1046],
      talk: [590],
      wave: [523, 659],
      nod: [440, 554],
      surprise: [659, 988],
    }[type] || [520];

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type === "sleep" ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.055, audioContext.currentTime + index * 0.08 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + index * 0.08 + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * 0.08);
      oscillator.stop(audioContext.currentTime + index * 0.08 + 0.18);
    });
  }

  function burst(symbols, count = 7) {
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      particle.className = "pet-particle";
      particle.textContent = randomItem(symbols);
      particleLayer.appendChild(particle);
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.45;
      const distance = 70 + Math.random() * 90;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 35;
      if (window.gsap && !reducedMotion) {
        gsap.fromTo(
          particle,
          { x: 0, y: 0, scale: 0.4, autoAlpha: 0 },
          {
            x,
            y,
            scale: 0.8 + Math.random() * 0.65,
            rotation: -80 + Math.random() * 160,
            autoAlpha: 0,
            duration: 0.85 + Math.random() * 0.35,
            ease: "power2.out",
            onStart: () => gsap.to(particle, { autoAlpha: 1, duration: 0.12 }),
            onComplete: () => particle.remove(),
          },
        );
      } else {
        particle.remove();
      }
    }
  }

  function startIdle() {
    idleTimeline?.kill();
    rig?.setMotion(state.motion);
    if (!window.gsap || reducedMotion || !state.motion || dragging || actionLocked) return;
    idleTimeline = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
    idleTimeline
      .to(shadow, { scaleX: 0.94, autoAlpha: 0.78, duration: 1.8 }, 0);
  }

  function stopActionTimeline() {
    actionTimeline?.kill();
    actionTimeline = null;
    rig?.stop();
    if (window.gsap) {
      gsap.set(visual, { clearProps: "transform" });
      gsap.set(shadow, { clearProps: "transform,opacity" });
      gsap.set(".sleep-mark", { autoAlpha: 0, clearProps: "transform" });
    }
  }

  function runAction(type) {
    if (actionLocked) return;
    if (type === "feed" && state.coins < 3) {
      setSpeech("桃花币不够啦，明天的小礼记得来领。");
      return;
    }
    if ((type === "play" || type === "dance") && state.energy < 8) {
      setSpeech("有一点累啦，先休息一下再玩吧。");
      return;
    }

    const config = {
      pet: { delta: { mood: 5, xp: 5 }, line: "pet", particles: ["♡", "✿", "♡"] },
      feed: { delta: { hunger: 18, mood: 3, xp: 7, coins: -3 }, line: "feed", particles: ["✿", "甜", "♪"] },
      play: { delta: { hunger: -4, mood: 8, energy: -8, xp: 9 }, line: "play", particles: ["✦", "跃", "✿"] },
      dance: { delta: { hunger: -3, mood: 10, energy: -7, xp: 11 }, line: "dance", particles: ["♪", "✦", "舞"] },
      sleep: { delta: { hunger: -2, mood: 2, energy: 18, xp: 6 }, line: "sleep", particles: ["Z", "·", "Z"] },
      talk: { delta: { mood: 2, xp: 4 }, line: "idle", particles: ["…", "♡", "♪"] },
      wave: { delta: { mood: 3, xp: 3 }, line: "idle", particles: ["嗨", "♡", "✦"] },
      nod: { delta: { mood: 2, xp: 3 }, line: "idle", particles: ["嗯", "♪", "·"] },
      surprise: { delta: { mood: 4, energy: -2, xp: 5 }, line: "idle", particles: ["！", "✦", "♡"] },
    }[type];

    if (!config) return;
    const actionCounter = {
      play: "plays",
      feed: "feeds",
      dance: "dances",
      pet: "pets",
      sleep: "sleeps",
    }[type];
    if (actionCounter) state[actionCounter] += 1;
    addProgress(config.delta);
    setSpeech(randomItem(dialogueLines[config.line]));
    playSound(type);
    burst(config.particles, type === "dance" ? 12 : 7);

    if (!window.gsap || reducedMotion || !state.motion) return;
    actionLocked = true;
    actionButtons.forEach((button) => { button.disabled = true; });
    idleTimeline?.pause();
    stopActionTimeline();
    const done = () => {
      actionLocked = false;
      actionButtons.forEach((button) => { button.disabled = false; });
      startIdle();
    };
    actionTimeline = rig?.play(type, done);
    if (type === "play") {
      gsap.timeline()
        .to(shadow, { scaleX: 0.58, autoAlpha: 0.42, duration: 0.3 }, 0.18)
        .to(shadow, { scaleX: 1, autoAlpha: 1, duration: 0.35 });
    }
    if (type === "sleep") {
      gsap.timeline()
        .to(".sleep-mark", { autoAlpha: 1, y: -22, duration: 0.6, ease: "sine.out" }, 0.25)
        .to(".sleep-mark", { autoAlpha: 0, y: -50, duration: 0.55 });
    }
    if (!actionTimeline) {
      actionTimeline = gsap.timeline({ onComplete: done })
        .to(visual, { y: -10, scale: 1.025, duration: 0.24, ease: "back.out(1.8)" })
        .to(visual, { y: 0, scale: 1, duration: 0.3 });
    }
  }

  function setPosition(x, y, save = true) {
    const roomRect = room.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const maxX = Math.max(0, (roomRect.width - stageRect.width) / 2 - 15);
    const maxY = Math.max(0, (roomRect.height - stageRect.height) / 2 - 80);
    state.position.x = clamp(x, -maxX, maxX);
    state.position.y = clamp(y, -maxY, maxY);
    if (window.gsap) {
      gsap.set(stage, { x: state.position.x, y: state.position.y });
    } else {
      stage.style.translate = `${state.position.x}px ${state.position.y}px`;
    }
    if (save) saveState();
  }

  character.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    dragMoved = false;
    pointerStart = { x: event.clientX, y: event.clientY };
    positionStart = { ...state.position };
    character.setPointerCapture(event.pointerId);
    idleTimeline?.pause();
    rig?.setDragging(true);
    if (window.gsap && state.motion && !reducedMotion) {
      gsap.to(visual, { scale: 1.035, rotation: -1, duration: 0.18 });
      gsap.to(shadow, { scaleX: 0.86, autoAlpha: 0.72, duration: 0.18 });
    }
  });

  character.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    if (Math.hypot(dx, dy) > 5) dragMoved = true;
    setPosition(positionStart.x + dx, positionStart.y + dy, false);
  });

  function finishDrag(event) {
    if (!dragging) return;
    dragging = false;
    rig?.setDragging(false);
    if (character.hasPointerCapture(event.pointerId)) character.releasePointerCapture(event.pointerId);
    saveState();
    if (window.gsap && state.motion && !reducedMotion) {
      gsap.to(visual, { scale: 1, rotation: 0, duration: 0.28, ease: "back.out(1.8)" });
      gsap.to(shadow, { scaleX: 1, autoAlpha: 1, duration: 0.25 });
    }
    startIdle();
    if (!dragMoved) runAction("pet");
    else setSpeech("这里也不错，那就先待在这里吧。");
  }

  character.addEventListener("pointerup", finishDrag);
  character.addEventListener("pointercancel", finishDrag);
  character.addEventListener("click", (event) => event.preventDefault());
  actionButtons.forEach((button) => button.addEventListener("click", () => runAction(button.dataset.action)));
  document.addEventListener("pointermove", (event) => rig?.trackPointer(event.clientX, event.clientY), { passive: true });
  document.documentElement.addEventListener("pointerleave", () => rig?.resetGaze(), { passive: true });
  window.addEventListener("blur", () => rig?.resetGaze());

  soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    updateUI();
    if (state.sound) playSound("talk");
  });

  motionToggle.addEventListener("click", () => {
    state.motion = !state.motion;
    rig?.setMotion(state.motion);
    updateUI();
    if (state.motion) startIdle();
    else {
      idleTimeline?.kill();
      actionTimeline?.kill();
      actionLocked = false;
      actionButtons.forEach((button) => { button.disabled = false; });
      stopActionTimeline();
    }
  });

  sceneToggle.addEventListener("click", () => {
    state.night = !state.night;
    updateUI();
    setSpeech(state.night ? "月亮出来啦，小屋也安静了一点。" : "天亮啦，窗边暖洋洋的。");
  });

  resetPet.addEventListener("click", () => {
    if (window.gsap && !reducedMotion) {
      gsap.to(stage, {
        x: 0,
        y: 0,
        duration: 0.55,
        ease: "back.out(1.5)",
        onComplete: () => setPosition(0, 0),
      });
    } else {
      setPosition(0, 0);
    }
    setSpeech("回到最熟悉的位置啦。");
  });

  dailyGift.addEventListener("click", () => {
    if (state.lastGift === todayKey()) return;
    state.lastGift = todayKey();
    state.coins += 10;
    state.xp += 5;
    updateUI();
    setSpeech("今日小礼送到！记得明天也回来看看。", 5200);
    burst(["✿", "✦", "币"], 13);
    playSound("reward");
  });

  window.addEventListener("resize", () => setPosition(state.position.x, state.position.y, false));
  window.addEventListener("beforeunload", saveState);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      idleTimeline?.pause();
      saveState();
    } else {
      startIdle();
    }
  });

  async function init() {
    if (window.HutaoRig) {
      rig = await window.HutaoRig.create(
        document.querySelector("#petCanvas"),
        document.querySelector("#petVisual"),
        { reducedMotion },
      );
      rig.setMotion(state.motion);
    }
    updateClock();
    window.setInterval(updateClock, 30000);
    checkAchievements();
    updateUI();
    setPosition(state.position.x, state.position.y, false);

    if (window.gsap && !reducedMotion) {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".pet-intro > div:first-child > *", { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.65 })
        .from(".pet-day-card", { x: 22, autoAlpha: 0, duration: 0.55 }, "-=0.45")
        .from(".pet-room", { y: 28, autoAlpha: 0, duration: 0.75 }, "-=0.35")
        .from(".pet-status-panel, .pet-dialogue, .pet-action-dock", {
          y: 16,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 0.45,
        }, "-=0.35")
        .from(visual, { y: 45, scale: 0.9, autoAlpha: 0, duration: 0.7, ease: "back.out(1.4)" }, "-=0.38")
        .add(startIdle);
    } else {
      startIdle();
    }
  }

  init();
})();
