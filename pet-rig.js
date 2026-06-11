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
      this.host.closest(".pet-rig")?.classList.add("rig-ready", "layered-rig");
      this.startIdle();
      this.scheduleBlink();
    }

    setMotion(enabled) {
      this.motion = enabled;
      if (enabled) {
        this.startIdle();
        this.scheduleBlink();
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
      const y = clamp(((clientY - rect.top) / rect.height) * 2 - 1);
      this.pointer = { x, y };
      gsap.to(this.parts.head, {
        x: x * 5,
        y: y * 3,
        rotation: x * 1.5,
        duration: 0.45,
        overwrite: "auto",
        ease: "power2.out",
      });
      gsap.to([this.parts.eyeLeft, this.parts.eyeRight], {
        x: x * 2.6,
        y: y * 1.8,
        duration: 0.25,
        overwrite: "auto",
      });
    }

    startIdle() {
      this.idleTimeline?.kill();
      if (!window.gsap || this.reducedMotion || !this.motion || this.dragging || !this.parts) return;
      this.idleTimeline = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } })
        .to(this.parts.puppet, { y: -3, duration: 1.7 }, 0)
        .to(this.parts.body, { scaleY: 1.012, scaleX: 0.994, duration: 1.7 }, 0)
        .to(this.parts.head, { y: -2, rotation: 0.7, duration: 1.7 }, 0)
        .to([this.parts.armLeft, this.parts.armRight], { rotation: (index) => index ? 1.2 : -1.2, duration: 1.7 }, 0);
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
      if (!window.gsap) return;
      gsap.timeline()
        .to([this.parts.eyeLeft, this.parts.eyeRight], {
          scaleY: 0.08,
          y: 5,
          duration,
          transformOrigin: "50% 58%",
          ease: "power2.in",
        })
        .to([this.parts.eyeLeft, this.parts.eyeRight], {
          scaleY: 1,
          y: 0,
          duration: duration * 1.25,
          ease: "power2.out",
        });
    }

    resetParts(duration = 0) {
      if (!window.gsap || !this.parts) return;
      const targets = [
        this.parts.puppet,
        this.parts.body,
        this.parts.head,
        this.parts.armLeft,
        this.parts.armRight,
        this.parts.forearmLeft,
        this.parts.forearmRight,
        this.parts.legLeft,
        this.parts.legRight,
        this.parts.calfLeft,
        this.parts.calfRight,
        this.parts.eyeLeft,
        this.parts.eyeRight,
        this.parts.mouth,
        this.parts.hat,
      ];
      gsap.to(targets, {
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
      const settle = () => timeline.add(() => this.resetParts(0.28));

      if (type === "pet") {
        timeline
          .to(p.head, { y: 8, scaleX: 1.025, scaleY: 0.97, duration: 0.2 })
          .add(() => this.blink(0.12), 0.02)
          .to(p.hat, { y: 3, scaleY: 0.985, duration: 0.18 }, 0)
          .to(p.head, { y: -3, scaleX: 0.995, scaleY: 1.012, duration: 0.24 });
        settle();
      } else if (type === "feed") {
        timeline
          .to(p.head, { rotation: -3, x: -2, duration: 0.2 })
          .to(p.mouth, { scaleY: 2.3, scaleX: 1.18, y: 2, duration: 0.12 }, 0.08)
          .to(p.head, { rotation: 3, x: 2, duration: 0.2 })
          .to(p.mouth, { scaleY: 0.8, scaleX: 0.92, duration: 0.12 }, "<")
          .to(p.head, { rotation: -2, duration: 0.18 });
        settle();
      } else if (type === "play") {
        timeline
          .to(p.puppet, { y: 12, scaleX: 1.035, scaleY: 0.96, duration: 0.17, ease: "power2.in" })
          .to([p.armLeft, p.armRight], { rotation: (index) => index ? -22 : 22, duration: 0.18 }, 0)
          .to(p.puppet, { y: -52, scaleX: 0.985, scaleY: 1.025, duration: 0.32, ease: "power3.out" })
          .to([p.legLeft, p.legRight], { rotation: (index) => index ? 8 : -8, duration: 0.24 }, "<")
          .to([p.calfLeft, p.calfRight], { rotation: (index) => index ? -12 : 12, duration: 0.24 }, "<")
          .to(p.puppet, { y: 0, scaleX: 1.025, scaleY: 0.97, duration: 0.34, ease: "bounce.out" });
        settle();
      } else if (type === "dance") {
        timeline
          .to(p.body, { rotation: -5, x: -10, duration: 0.22 })
          .to(p.head, { rotation: 4, x: -5, duration: 0.22 }, 0)
          .to(p.armLeft, { rotation: 28, duration: 0.22 }, 0)
          .to(p.armRight, { rotation: -8, duration: 0.22 }, 0)
          .to(p.body, { rotation: 5, x: 10, duration: 0.24 })
          .to(p.head, { rotation: -4, x: 5, duration: 0.24 }, "<")
          .to(p.armLeft, { rotation: 8, duration: 0.24 }, "<")
          .to(p.armRight, { rotation: -28, duration: 0.24 }, "<")
          .to(p.body, { rotation: -5, x: -9, duration: 0.22 })
          .to(p.head, { rotation: 4, x: -4, duration: 0.22 }, "<");
        settle();
      } else if (type === "sleep") {
        timeline
          .to(p.head, { rotation: 7, y: 8, duration: 0.38, ease: "sine.inOut" })
          .to([p.eyeLeft, p.eyeRight], { scaleY: 0.08, y: 5, duration: 0.14 }, 0.15)
          .to(p.body, { y: 5, scaleY: 0.985, duration: 0.45 }, 0)
          .to([p.head, p.body], { y: "+=3", duration: 0.7, repeat: 1, yoyo: true, ease: "sine.inOut" });
        settle();
      } else if (type === "wave") {
        timeline
          .to(p.armRight, { rotation: -76, duration: 0.3, ease: "back.out(1.7)" })
          .to(p.forearmRight, { rotation: -48, duration: 0.22 }, 0.18)
          .to(p.forearmRight, { rotation: -18, duration: 0.16, repeat: 4, yoyo: true, ease: "sine.inOut" })
          .to(p.head, { rotation: -3, duration: 0.25 }, 0);
        settle();
      } else if (type === "nod" || type === "talk") {
        timeline
          .to(p.head, { y: 8, rotation: 1, duration: 0.18 })
          .add(() => this.blink(0.09), 0.07)
          .to(p.head, { y: -3, rotation: -1, duration: 0.2 })
          .to(p.head, { y: 6, rotation: 1, duration: 0.17 });
        if (type === "talk") {
          timeline.to(p.mouth, { scaleY: 2, duration: 0.09, repeat: 3, yoyo: true }, 0.1);
        }
        settle();
      } else if (type === "surprise") {
        timeline
          .to(p.puppet, { y: -15, scale: 1.035, duration: 0.2, ease: "back.out(2)" })
          .to([p.armLeft, p.armRight], { rotation: (index) => index ? -24 : 24, duration: 0.2 }, 0)
          .to([p.eyeLeft, p.eyeRight], { scale: 1.12, duration: 0.16 }, 0)
          .to(p.mouth, { scaleY: 3, scaleX: 1.25, y: 2, duration: 0.16 }, 0);
        settle();
      } else {
        timeline.to(p.head, { rotation: 2, duration: 0.2 });
        settle();
      }

      return timeline;
    }
  }

  window.HutaoRig = HutaoRig;
})();
