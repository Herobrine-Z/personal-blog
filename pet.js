(() => {
  "use strict";

  const STORAGE_KEY = "hutao-house-state-v3";
  const clamp = (value) => Math.min(100, Math.max(0, value));
  const today = () => new Date().toISOString().slice(0, 10);
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function setupEntryScene() {
    const entry = $("#petEntry");
    if (!entry) return () => {};

    const bar = $("#petEntryBar");
    const number = $("#petEntryNumber");
    const status = $("#petEntryStatus");
    const skip = $("#petEntrySkip");
    const startedAt = performance.now();
    const minimumDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 650 : 2600;
    let assetsReady = false;
    let finished = false;
    let progress = 0;

    const leave = () => {
      if (finished) return;
      finished = true;
      bar.style.width = "100%";
      number.textContent = "100";
      status.textContent = "已到胡桃小屋";
      entry.classList.add("is-leaving");
      document.body.classList.remove("pet-entry-active");
      window.setTimeout(() => entry.remove(), 420);
    };

    const tick = () => {
      if (finished) return;
      const elapsed = performance.now() - startedAt;
      const ratio = Math.min(1, elapsed / minimumDuration);
      const target = 5 + (1 - Math.pow(1 - ratio, 2.2)) * 95;
      progress += Math.max(0.45, (target - progress) * 0.14);
      progress = Math.min(100, progress);
      const rounded = Math.floor(progress);
      bar.style.width = `${progress}%`;
      number.textContent = String(rounded);

      if (rounded > 72) status.textContent = assetsReady ? "马上就好" : "正在唤醒角色";
      else if (rounded > 38) status.textContent = "正在备好茶点";

      if (elapsed >= minimumDuration) {
        leave();
        return;
      }
      window.requestAnimationFrame(tick);
    };

    skip.addEventListener("click", leave);
    window.requestAnimationFrame(tick);
    return () => {
      assetsReady = true;
    };
  }

  const markEntryReady = setupEntryScene();

  const defaults = {
    hunger: 78,
    mood: 84,
    energy: 76,
    xp: 0,
    level: 1,
    coins: 20,
    lastGift: "",
    motion: true,
    sound: true,
    deepNight: false,
  };

  let state = loadState();
  let rig = null;
  let busy = false;
  let audioContext = null;
  let toastTimer = 0;
  let drag = null;
  let stageOffset = { x: 0, y: 0 };
  let characterKey = "hutao";
  let modelLoadToken = 0;
  const characterOrder = ["hutao", "fireman", "zhang"];

  const characters = {
    hutao: {
      name: "小桃",
      relation: "亲密伙伴",
      modelUrl: "./assets/models/HutaoSeethrough/seethrough_output.model3.json",
      scale: 0.8,
      y: 0.52,
      welcome: "这次真的醒过来啦！移动光标看看？",
      actions: {
        pet: ["嘿嘿，再摸一下也不是不行。", "帽子可不能揉乱啦！"],
        feed: ["唔，这个味道不错！", "吃饱才有力气工作嘛。"],
        play: ["抓到你啦！再来一次！", "今天的胜负可还没定呢。"],
        dance: ["一二三，跟上本堂主的节拍！", "这支舞就当今日特别演出。"],
        sleep: ["只眯一小会儿……呼……", "午后的阳光最适合打盹。"],
        wave: ["我一直都看见你哦！", "嗨！今天也要开心。"],
      },
    },
    fireman: {
      name: "季沧海",
      relation: "登门访客",
      modelUrl: "./assets/models/Fireman/Fireman.model3.json",
      scale: 0.8,
      y: 0.52,
      welcome: "听说这里有好酒好茶，我便来串个门。",
      actions: {
        pet: ["哈哈，胆子不小。", "这份热情，我记下了。"],
        feed: ["不错，再来一碗。", "有酒有肉，才叫痛快。"],
        play: ["来，痛痛快快比一场！", "这点热身还不够尽兴。"],
        dance: ["烈火随心，步子自然也要豪迈。", "今日兴起，便舞上一回。"],
        sleep: ["养足精神，再战不迟。", "我先歇片刻，酒可别收走。"],
        wave: ["季沧海，前来拜访。", "有朋在此，岂能不来？"],
      },
    },
    zhang: {
      name: "张起灵",
      relation: "沉默访客",
      modelUrl: "./assets/models/Zhang/Zhang.model3.json",
      scale: 0.8,
      y: 0.52,
      welcome: "我来了。这里，很安静。",
      actions: {
        pet: ["……别闹。", "嗯。"],
        feed: ["谢谢。", "够了。"],
        play: ["跟上。", "动作要快。"],
        dance: ["不太擅长。", "只一次。"],
        sleep: ["我守着。", "休息吧。"],
        wave: ["张起灵。", "我在。"],
      },
    },
  };

  const actionData = {
    pet: { mood: 8, energy: -1, xp: 5, sound: 540 },
    feed: { hunger: 14, mood: 3, coins: -2, xp: 6, sound: 650 },
    play: { mood: 7, energy: -8, hunger: -3, xp: 8, sound: 760 },
    dance: { mood: 12, energy: -7, xp: 9, sound: 820 },
    sleep: { energy: 16, hunger: -3, xp: 4, sound: 330 },
    wave: { mood: 4, xp: 5, sound: 710 },
  };

  function loadState() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch (_) {
      return { ...defaults };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function updateUI() {
    $("#hungerValue").textContent = Math.round(state.hunger);
    $("#moodValue").textContent = Math.round(state.mood);
    $("#energyValue").textContent = Math.round(state.energy);
    $("#hungerBar").style.width = `${state.hunger}%`;
    $("#moodBar").style.width = `${state.mood}%`;
    $("#energyBar").style.width = `${state.energy}%`;
    $("#petLevel").textContent = state.level;
    $("#petCoins").textContent = state.coins;
    $("#petXpText").textContent = `${state.xp} / 100`;
    $("#petXpBar").style.width = `${state.xp}%`;

    const gift = $("#dailyGift");
    const claimed = state.lastGift === today();
    gift.disabled = claimed;
    gift.querySelector("strong").textContent = claimed ? "今日已领取" : "领取 10 枚桃花币";
    setToggle($("#motionToggle"), state.motion, `动态：${state.motion ? "开" : "关"}`);
    setToggle($("#soundToggle"), state.sound, `音效：${state.sound ? "开" : "关"}`);
    setToggle($("#sceneToggle"), state.deepNight, `夜色：${state.deepNight ? "深" : "浅"}`);
    $("#petRoom").classList.toggle("is-deep-night", state.deepNight);
  }

  function setToggle(button, active, label) {
    button.classList.toggle("is-on", active);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = label;
  }

  function addValue(key, amount) {
    if (!amount) return;
    if (key === "coins") state.coins = Math.max(0, state.coins + amount);
    else if (key === "xp") {
      state.xp += amount;
      while (state.xp >= 100) {
        state.xp -= 100;
        state.level += 1;
        state.coins += 12;
        showToast(`亲密等级提升到 Lv.${state.level}`);
      }
    } else state[key] = clamp(state[key] + amount);
  }

  function speak(lines) {
    const line = Array.isArray(lines) ? lines[Math.floor(Math.random() * lines.length)] : lines;
    const speech = $("#petSpeech");
    speech.animate([{ opacity: 0.2, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 260 });
    speech.textContent = line;
    const speakingDuration = Math.min(5.2, Math.max(1.4, [...String(line)].length * 0.16));
    rig?.speak(speakingDuration);
  }

  function showToast(message) {
    const toast = $("#petToast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function makeSparks(x, y, count = 8) {
    for (let index = 0; index < count; index += 1) {
      const spark = document.createElement("i");
      spark.className = "pet-spark";
      spark.textContent = index % 2 ? "✦" : "·";
      spark.style.left = `${x + (Math.random() - 0.5) * 42}px`;
      spark.style.top = `${y + (Math.random() - 0.5) * 28}px`;
      spark.style.setProperty("--dx", `${(Math.random() - 0.5) * 90}px`);
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 850);
    }
  }

  function playSound(frequency = 620) {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.18, audioContext.currentTime + 0.11);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, audioContext.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.17);
    } catch (_) {
      state.sound = false;
      updateUI();
    }
  }

  function runAction(name, source) {
    if (busy || !actionData[name]) return;
    const data = actionData[name];
    if (data.coins && state.coins + data.coins < 0) {
      speak("桃花币不够啦，先领取今日小礼吧。");
      showToast("桃花币不足");
      return;
    }

    busy = true;
    $$("[data-action]").forEach((button) => { button.disabled = true; });
    speak(characters[characterKey].actions[name]);
    playSound(data.sound);
    const rect = (source || $("#petCharacter")).getBoundingClientRect();
    makeSparks(rect.left + rect.width / 2, rect.top + rect.height * 0.42, name === "dance" ? 14 : 8);

    ["hunger", "mood", "energy", "xp", "coins"].forEach((key) => addValue(key, data[key]));
    saveState();
    updateUI();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      busy = false;
      $$("[data-action]").forEach((button) => { button.disabled = false; });
    };
    setTimeout(finish, 3200);
    if (!rig?.play(name, finish)) {
      $("#petCharacter").animate(
        [{ transform: "translateY(0) scale(1)" }, { transform: "translateY(-24px) scale(1.02)" }, { transform: "translateY(0) scale(1)" }],
        { duration: 700, easing: "ease-out" },
      ).onfinish = finish;
    }
  }

  function setClock() {
    const date = new Date();
    $("#petClock").textContent = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const hour = date.getHours();
    $("#petGreeting").textContent = hour < 6 ? "夜深相伴" : hour < 12 ? "早安相伴" : hour < 18 ? "午后相伴" : "晚间相伴";
    $("#petDayText").textContent = hour < 6 ? "还没睡吗？我陪你守一会儿夜" : hour < 12 ? "往生堂今日也准时开门" : hour < 18 ? "窗外阳光正好，适合偷闲" : "灯笼亮起来了，欢迎回家";
  }

  function bindDragging() {
    const character = $("#petCharacter");
    character.addEventListener("pointerdown", (event) => {
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, originX: stageOffset.x, originY: stageOffset.y, moved: false };
      character.setPointerCapture(event.pointerId);
    });
    character.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      drag.moved ||= Math.abs(dx) + Math.abs(dy) > 7;
      stageOffset.x = Math.max(-220, Math.min(220, drag.originX + dx));
      stageOffset.y = Math.max(-115, Math.min(110, drag.originY + dy));
      $("#petStage").style.transform = `translate3d(${stageOffset.x}px, ${stageOffset.y}px, 0)`;
    });
    character.addEventListener("pointerup", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved) runAction("pet", character);
      drag = null;
    });
    character.addEventListener("pointercancel", () => { drag = null; });
  }

  function updateCharacterUI() {
    const character = characters[characterKey];
    const visiting = characterKey !== "hutao";
    const nextKey = characterOrder[(characterOrder.indexOf(characterKey) + 1) % characterOrder.length];
    const nextCharacter = characters[nextKey];
    $("#profileName").textContent = character.name;
    $("#profileRelation").textContent = character.relation;
    $("#speakerName").textContent = character.name;
    $("#petCharacter").setAttribute("aria-label", `与${character.name}互动，按住可以拖动`);
    $("#petRoom").classList.toggle("is-visitor", visiting);
    $("#profileAvatarText").textContent = character.name.slice(0, 1);
    const visitToggle = $("#visitToggle");
    visitToggle.classList.toggle("is-active", visiting);
    visitToggle.setAttribute("aria-pressed", String(visiting));
    visitToggle.querySelector("span").textContent = nextKey === "hutao" ? "送客" : "串门";
    visitToggle.querySelector("strong").textContent = nextKey === "hutao" ? `请${character.name}下次再来` : `邀请${nextCharacter.name}来坐坐`;
  }

  async function loadCharacter(nextKey, initial = false) {
    const status = $("#modelStatus");
    const token = ++modelLoadToken;
    const character = characters[nextKey];
    characterKey = nextKey;
    updateCharacterUI();
    status.classList.remove("is-ready", "is-error");
    status.querySelector("span").textContent = `正在迎接${character.name}…`;
    $("#petRig").classList.remove("is-live2d-ready");
    rig?.destroy();
    rig = null;
    try {
      rig = await new HutaoRig($("#petRig"), {
        modelUrl: character.modelUrl,
        scale: character.scale,
        y: character.y,
      }).init();
      if (token !== modelLoadToken) {
        rig.destroy();
        return;
      }
      rig.setMotion(state.motion);
      status.classList.add("is-ready");
      status.querySelector("span").textContent = `${character.name}已到 · Live2D 运行中`;
      speak(character.welcome);
    } catch (error) {
      if (token !== modelLoadToken) return;
      console.error(`${character.name} Live2D init failed:`, error);
      status.classList.add("is-error");
      status.querySelector("span").textContent = `${character.name}暂时未能到访`;
      speak(`${character.name}似乎在路上耽搁了，请稍后再试。`);
    } finally {
      if (initial) markEntryReady();
    }
  }

  function initRig() {
    return loadCharacter("hutao", true);
  }

  function bindControls() {
    $$("[data-action]").forEach((button) => button.addEventListener("click", () => runAction(button.dataset.action, button)));
    $("#dailyGift").addEventListener("click", (event) => {
      if (state.lastGift === today()) return;
      state.lastGift = today();
      state.coins += 10;
      state.mood = clamp(state.mood + 5);
      saveState();
      updateUI();
      playSound(880);
      const rect = event.currentTarget.getBoundingClientRect();
      makeSparks(rect.left + rect.width / 2, rect.top, 14);
      speak("今日份的桃花币，收好啦！");
      showToast("获得 10 枚桃花币");
    });
    $("#motionToggle").addEventListener("click", () => {
      state.motion = !state.motion;
      rig?.setMotion(state.motion);
      saveState();
      updateUI();
      speak(state.motion ? "好啦，我继续活动活动。" : "那我先安静地待一会儿。");
    });
    $("#soundToggle").addEventListener("click", () => {
      state.sound = !state.sound;
      saveState();
      updateUI();
      if (state.sound) playSound(700);
    });
    $("#sceneToggle").addEventListener("click", () => {
      state.deepNight = !state.deepNight;
      saveState();
      updateUI();
    });
    $("#visitToggle").addEventListener("click", async (event) => {
      if (busy || event.currentTarget.disabled) return;
      const button = event.currentTarget;
      const nextKey = characterOrder[(characterOrder.indexOf(characterKey) + 1) % characterOrder.length];
      const nextCharacter = characters[nextKey];
      button.disabled = true;
      playSound(nextKey === "fireman" ? 460 : nextKey === "zhang" ? 390 : 620);
      showToast(nextKey === "hutao" ? `${characters[characterKey].name}告辞离开` : `${nextCharacter.name}正在登门`);
      await loadCharacter(nextKey);
      button.disabled = false;
    });
    $("#resetPosition").addEventListener("click", () => {
      stageOffset = { x: 0, y: 0 };
      $("#petStage").style.transform = "translate3d(0, 0, 0)";
      speak("又回到最舒服的位置啦。");
    });
  }

  function init() {
    updateUI();
    setClock();
    setInterval(setClock, 30000);
    bindControls();
    bindDragging();
    window.addEventListener("pointermove", (event) => {
      if (!drag) rig?.trackPointer(event.clientX, event.clientY);
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => rig?.resetGaze());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) rig?.resetGaze();
    });
    initRig();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
