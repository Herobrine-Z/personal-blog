(function () {
  "use strict";

  const room = document.querySelector("#petRoom");
  if (!room) return;

  function currentScene(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 19) return "dusk";
    return "night";
  }

  function applyScene(scene) {
    room.dataset.timeScene = scene;
    document.body.dataset.petScene = scene;
    const label = {
      dawn: "场景：清晨",
      day: "场景：白天",
      dusk: "场景：黄昏",
      night: "场景：夜晚",
    }[scene] || "场景：自动";
    const button = document.querySelector("#sceneToggle");
    if (button) {
      button.textContent = label;
      button.setAttribute("aria-pressed", scene !== currentScene());
    }
  }

  applyScene(currentScene());

  document.querySelector("#sceneToggle")?.addEventListener("click", () => {
    const order = ["dawn", "day", "dusk", "night"];
    const next = order[(order.indexOf(room.dataset.timeScene) + 1) % order.length];
    applyScene(next);
  });
}());
