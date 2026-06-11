(() => {
  "use strict";

  const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));

  class HutaoRig {
    constructor(host, faceRoot, options = {}) {
      this.host = host;
      this.faceRoot = faceRoot;
      this.reducedMotion = Boolean(options.reducedMotion);
      this.motion = true;
      this.dragging = false;
      this.actionTimeline = null;
      this.idleTimeline = null;
      this.blinkTimer = null;
      this.pointer = { x: 0, y: 0 };
    }

    static async create(host, faceRoot, options) {
      const rig = new HutaoRig(host, faceRoot, options);
      rig.init();
      return rig;
    }

    init() {
      if (!this.host) return;
      const asset = (name, className = "") =>
        `<img class="puppet-part ${className}" src="./assets/hutao-rig/${name}.png" alt="" draggable="false" />`;

      this.host.innerHTML = `
        <span class="puppet" data-puppet>
          <span class="puppet-bone leg-bone leg-left" data-bone="legLeft">
            ${asset("thigh-left", "thigh-part")}
            <span class="puppet-bone calf-bone" data-bone="calfLeft">${asset("calf-left")}</span>
          </span>
          <span class="puppet-bone leg-bone leg-right" data-bone="legRight">
            ${asset("thigh-right", "thigh-part")}
            <span class="puppet-bone calf-bone" data-bone="calfRight">${asset("calf-right")}</span>
          </span>

          <span class="puppet-bone arm-bone arm-left" data-bone="armLeft">
            ${asset("upper-arm-left", "upper-arm-part")}
            <span class="puppet-bone forearm-bone" data-bone="forearmLeft">${asset("forearm-left")}</span>
          </span>
          <span class="puppet-bone arm-bone arm-right" data-bone="armRight">
            ${asset("upper-arm-right", "upper-arm-part")}
            <span class="puppet-bone forearm-bone" data-bone="forearmRight">${asset("forearm-right")}</span>
          </span>

          <span class="puppet-bone body-bone" data-bone="body">${asset("body")}</span>

          <span class="puppet-bone head-bone" data-bone="head">
            ${asset("face", "face-part")}
            ${asset("eye-left", "eye-part eye-part-left")}
            ${asset("eye-right", "eye-part eye-part-right")}
            ${asset("mouth", "mouth-part")}
            ${asset("hair", "hair-part")}
            ${asset("hat", "hat-part")}
          </span>
        </span>`;

      this.parts = {
        puppet: this.host.querySelector("[data-puppet]"),
        body: this.host.querySelector('[data-bone="body"]'),
        head: this.host.querySelector('[data-bone="head"]'),
        armLeft: this.host.querySelector('[data-bone="armLeft"]'),
        armRight: this.host.querySelector('[data-bone="armRight"]'),
        forearmLeft: this.host.querySelector('[data-bone="forearmLeft"]'),
        forearmRight: this.host.querySelector('[data-bone="forearmRight"]'),
        legLeft: this.host.querySelector('[data-bone="legLeft"]'),
        legRight: this.host.querySelector('[data-bone="legRight"]'),
        calfLeft: this.host.querySelector('[data-bone="calfLeft"]'),
        calfRight: this.host.querySelector('[data-bone="calfRight"]'),
        eyeLeft: this.host.querySelector(".eye-part-left"),
        eyeRight: this.host.querySelector(".eye-part-right"),
        mouth: this.host.querySelector(".mouth-part"),
        hat: this.host.querySelector(".hat-part"),
      };
      this.rigRoot = this.host.closest(".pet-rig");
      this.parts.artwork = this.rigRoot?.querySelector(".pet-rig-fallback");
      this.rigRoot?.classList.add("rig-ready", "artwork-locked");
      this.startIdle();
    }

    setMotion(enabled) {
      this.motion = enabled;
      if (enabled) {
        this.startIdle();
      } else {
        this.stop();
      }
    }

    setDragging(dragging) {
      this.dragging = dragging;
      if (dragging) this.idleTimeline?.pause();
      else if (this.motion) this.idleTimeline?.resume();
    }

    trackPointer(clientX, clientY) {
      if (!this.motion || this.dragging || this.actionTimeline || !window.gsap) return;
      const rect = this.host.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 2 - 1);
      this.pointer = { x, y: clamp(((clientY - rect.top) / rect.height) * 2 - 1) };
      gsap.to(this.parts.artwork, {
        rotation: x * 0.8,
        duration: 0.45,
        overwrite: "auto",
        ease: "power2.out",
      });
    }

    startIdle() {
      this.idleTimeline?.kill();
      if (!window.gsap || this.reducedMotion || !this.motion || this.dragging || !this.parts) return;
      this.idleTimeline = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
        .to(this.parts.artwork, { y: -3, rotation: 0.35, duration: 1.7 }, 0);
    }

    scheduleBlink() {
      clearTimeout(this.blinkTimer);
      if (!this.motion || this.reducedMotion) return;
      this.blinkTimer = window.setTimeout(() => {
        if (!this.actionTimeline && !this.dragging) this.blink();
        this.scheduleBlink();
      }, 2500 + Math.random() * 2800);
    }

    blink(duration = 0.1) {
      return duration;
    }

    resetParts(duration = 0) {
      if (!window.gsap || !this.parts) return;
      gsap.to(this.parts.artwork, {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        duration,
        overwrite: true,
        ease: duration ? "back.out(1.4)" : "none",
      });
    }

    stop() {
      clearTimeout(this.blinkTimer);
      this.actionTimeline?.kill();
      this.actionTimeline = null;
      this.idleTimeline?.kill();
      this.idleTimeline = null;
      this.rigRoot?.classList.remove("rig-active");
      this.resetParts(0);
    }

    play(type, onComplete) {
      this.actionTimeline?.kill();
      this.idleTimeline?.pause();
      if (!window.gsap || this.reducedMotion || !this.motion || !this.parts) {
        onComplete?.();
        return null;
      }

      const p = this.parts;
      const timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          this.actionTimeline = null;
          this.startIdle();
          onComplete?.();
        },
      });
      this.actionTimeline = timeline;
      const settle = () => timeline.to(p.artwork, {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.28,
        ease: "back.out(1.4)",
      });

      if (type === "pet") {
        timeline
          .to(p.artwork, { y: 5, scale: 0.992, duration: 0.18 })
          .to(p.artwork, { y: -2, scale: 1.004, duration: 0.24 });
        settle();
      } else if (type === "feed") {
        timeline
          .to(p.artwork, { rotation: -1.8, y: 3, duration: 0.18 })
          .to(p.artwork, { rotation: 1.8, y: 0, duration: 0.18 })
          .to(p.artwork, { rotation: -1.2, y: 2, duration: 0.16 });
        settle();
      } else if (type === "play") {
        timeline
          .to(p.artwork, { y: 10, scale: 0.985, duration: 0.16, ease: "power2.in" })
          .to(p.artwork, { y: -48, scale: 1.012, rotation: -1.5, duration: 0.31, ease: "power3.out" })
          .to(p.artwork, { y: 0, scale: 1, rotation: 0, duration: 0.34, ease: "bounce.out" });
        settle();
      } else if (type === "dance") {
        timeline
          .to(p.artwork, { rotation: -4, x: -8, y: -3, duration: 0.22 })
          .to(p.artwork, { rotation: 4, x: 8, y: 0, duration: 0.24 })
          .to(p.artwork, { rotation: -3.5, x: -7, y: -3, duration: 0.22 });
        settle();
      } else if (type === "sleep") {
        timeline
          .to(p.artwork, { rotation: 3.5, y: 7, scale: 0.995, duration: 0.38, ease: "sine.inOut" })
          .to(p.artwork, { y: 10, duration: 0.7, repeat: 1, yoyo: true, ease: "sine.inOut" });
        settle();
      } else if (type === "wave") {
        timeline
          .to(p.artwork, { rotation: -3, x: -4, duration: 0.22, ease: "back.out(1.7)" })
          .to(p.artwork, { rotation: 2.5, x: 4, duration: 0.18, repeat: 3, yoyo: true, ease: "sine.inOut" });
        settle();
      } else if (type === "nod" || type === "talk") {
        timeline
          .to(p.artwork, { y: 6, rotation: 0.8, duration: 0.18 })
          .to(p.artwork, { y: -2, rotation: -0.8, duration: 0.2 })
          .to(p.artwork, { y: 4, rotation: 0.6, duration: 0.17 });
        settle();
      } else if (type === "surprise") {
        timeline
          .to(p.artwork, { y: -15, scale: 1.035, duration: 0.2, ease: "back.out(2)" })
          .to(p.artwork, { y: -5, scale: 1.012, duration: 0.2 });
        settle();
      } else {
        timeline.to(p.artwork, { rotation: 2, duration: 0.2 });
        settle();
      }

      return timeline;
    }
  }

  window.HutaoRig = HutaoRig;
})();
