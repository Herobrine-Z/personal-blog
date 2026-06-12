(() => {
  "use strict";

  const MODEL_URL = "./assets/models/Hutao/Hutao.model3.json";
  const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));

  class HutaoRig {
    constructor(host, faceRoot, options = {}) {
      this.host = host;
      this.faceRoot = faceRoot;
      this.reducedMotion = Boolean(options.reducedMotion);
      this.motion = true;
      this.dragging = false;
      this.ready = false;
      this.actionTimeline = null;
      this.blinkTimeline = null;
      this.blinkTimer = null;
      this.expressionTimer = null;
      this.gaze = { x: 0, y: 0 };
      this.values = this.defaults();
    }

    static async create(host, faceRoot, options) {
      const rig = new HutaoRig(host, faceRoot, options);
      await rig.init();
      return rig;
    }

    defaults() {
      return {
        angleX: 0,
        angleY: 0,
        angleZ: 0,
        bodyX: 0,
        bodyY: 0,
        bodyZ: 0,
        eyeX: 0,
        eyeY: 0,
        eyeOpen: 1,
        eyeSmile: 0,
        browY: 0,
        browAngle: 0,
        mouthForm: 0,
        mouthOpen: 0,
        cheek: 0,
        breath: 0,
        shoulder: 0,
        leg: 0,
        armR: 0,
        armL: 0,
      };
    }

    async init() {
      if (!this.host || !window.PIXI?.live2d?.Live2DModel) return;

      const canvas = document.createElement("canvas");
      canvas.className = "live2d-canvas";
      this.host.replaceChildren(canvas);

      try {
        this.app = new PIXI.Application({
          view: canvas,
          resizeTo: this.host,
          autoDensity: true,
          antialias: true,
          backgroundAlpha: 0,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        });
        this.model = await PIXI.live2d.Live2DModel.from(MODEL_URL, {
          autoInteract: false,
        });
        this.model.anchor.set(0.5, 0.5);
        this.app.stage.addChild(this.model);
        this.host.hutaoRig = this;
        this.fitModel();
        this.resizeObserver = new ResizeObserver(() => this.fitModel());
        this.resizeObserver.observe(this.host);
        this.app.ticker.add(() => this.updateParameters());
        this.ready = true;
        this.host.closest(".pet-rig")?.classList.add("rig-ready", "live2d-ready");
        this.scheduleBlink();
      } catch (error) {
        console.error("Live2D model failed to load:", error);
        this.app?.destroy(true);
        this.host.replaceChildren();
      }
    }

    fitModel() {
      if (!this.model || !this.host.clientWidth || !this.host.clientHeight) return;
      this.model.scale.set(1);
      const modelWidth = this.model.width;
      const modelHeight = this.model.height;
      const scale = Math.min(
        this.host.clientWidth / modelWidth,
        this.host.clientHeight / modelHeight,
      ) * 1.48;
      this.model.scale.set(scale);
      this.model.position.set(this.host.clientWidth / 2, this.host.clientHeight / 2);
    }

    setParameter(id, value) {
      this.model?.internalModel?.coreModel?.setParameterValueById(id, value);
    }

    updateParameters() {
      if (!this.ready) return;
      const value = this.values;
      const idle = this.motion && !this.dragging && !this.actionTimeline
        ? Math.sin(performance.now() / 900)
        : 0;
      value.breath = this.motion ? (idle + 1) / 2 : 0;

      this.setParameter("ParamAngleX", value.angleX + this.gaze.x * 22);
      this.setParameter("ParamAngleY", value.angleY + this.gaze.y * 16);
      this.setParameter("ParamAngleZ", value.angleZ + this.gaze.x * 5);
      this.setParameter("ParamBodyAngleX", value.bodyX + this.gaze.x * 5);
      this.setParameter("ParamBodyAngleY", value.bodyY + this.gaze.y * 3);
      this.setParameter("ParamBodyAngleZ", value.bodyZ + idle * 1.4);
      this.setParameter("ParamEyeBallX", value.eyeX + this.gaze.x);
      this.setParameter("ParamEyeBallY", value.eyeY - this.gaze.y);
      this.setParameter("ParamEyeLOpen", value.eyeOpen);
      this.setParameter("ParamEyeROpen", value.eyeOpen);
      this.setParameter("ParamEyeLSmile", value.eyeSmile);
      this.setParameter("ParamEyeRSmile", value.eyeSmile);
      this.setParameter("ParamBrowLY", value.browY);
      this.setParameter("ParamBrowRY", value.browY);
      this.setParameter("ParamBrowLAngle", value.browAngle);
      this.setParameter("ParamBrowRAngle", -value.browAngle);
      this.setParameter("ParamMouthForm", value.mouthForm);
      this.setParameter("ParamMouthOpenY", value.mouthOpen);
      this.setParameter("ParamCheek", value.cheek);
      this.setParameter("ParamBreath", value.breath);
      this.setParameter("ParamShoulder", value.shoulder);
      this.setParameter("ParamLeg", value.leg);
      this.setParameter("ParamArmRA", value.armR);
      this.setParameter("ParamArmLB", value.armL);
    }

    setMotion(enabled) {
      this.motion = enabled;
      if (enabled) this.scheduleBlink();
      else this.stop();
    }

    setDragging(dragging) {
      this.dragging = dragging;
      if (window.gsap) {
        gsap.to(this.gaze, {
          x: 0,
          y: dragging ? -0.18 : 0,
          duration: 0.25,
          overwrite: true,
        });
      }
    }

    setExpression(name = "default", duration = 0) {
      window.clearTimeout(this.expressionTimer);
      const expression = {
        happy: { eyeSmile: 0.75, mouthForm: 0.8, mouthOpen: 0.18, cheek: 0.45, browY: 0.15 },
        smile: { eyeSmile: 1, mouthForm: 0.9, mouthOpen: 0.1, cheek: 0.35 },
        surprised: { eyeOpen: 1, mouthForm: -0.15, mouthOpen: 0.85, browY: 0.65 },
        star: { eyeOpen: 1, mouthForm: 0.8, mouthOpen: 0.45, cheek: 0.55 },
        cry: { eyeSmile: 0.2, mouthForm: -0.8, mouthOpen: 0.18, browAngle: -0.7 },
        angry: { mouthForm: -0.7, browY: -0.35, browAngle: 0.8 },
        talk: { mouthForm: 0.35, mouthOpen: 0.55 },
        eat: { mouthForm: 0.45, mouthOpen: 0.8, cheek: 0.3 },
        sleep: { eyeOpen: 0, eyeSmile: 1, mouthForm: 0.25, mouthOpen: 0.05 },
      }[name] || {};
      Object.assign(this.values, {
        eyeOpen: 1,
        eyeSmile: 0,
        browY: 0,
        browAngle: 0,
        mouthForm: 0,
        mouthOpen: 0,
        cheek: 0,
      }, expression);
      if (duration > 0) {
        this.expressionTimer = window.setTimeout(() => this.setExpression("default"), duration);
      }
    }

    trackPointer(clientX, clientY) {
      if (!this.motion || this.dragging || this.actionTimeline || !window.gsap) return;
      const rect = this.host.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 2 - 1);
      const y = clamp(((clientY - rect.top) / rect.height) * 2 - 1);
      gsap.to(this.gaze, {
        x,
        y,
        duration: 0.42,
        overwrite: "auto",
        ease: "power2.out",
      });
    }

    scheduleBlink() {
      window.clearTimeout(this.blinkTimer);
      if (!this.motion || this.reducedMotion) return;
      this.blinkTimer = window.setTimeout(() => {
        if (!this.actionTimeline && !this.dragging) this.blink();
        this.scheduleBlink();
      }, 2400 + Math.random() * 3200);
    }

    blink() {
      if (!window.gsap) return;
      this.blinkTimeline?.kill();
      this.blinkTimeline = gsap.timeline({
        onComplete: () => {
          this.blinkTimeline = null;
        },
      })
        .to(this.values, { eyeOpen: 0, duration: 0.07, ease: "power2.in" })
        .to(this.values, { eyeOpen: 1, duration: 0.12, ease: "power2.out" }, "+=0.04");
    }

    resetValues(duration = 0) {
      const target = this.defaults();
      delete target.breath;
      if (window.gsap && duration) {
        gsap.to(this.values, { ...target, duration, overwrite: true, ease: "back.out(1.2)" });
      } else {
        Object.assign(this.values, target);
      }
      this.setExpression("default");
    }

    stop() {
      window.clearTimeout(this.blinkTimer);
      window.clearTimeout(this.expressionTimer);
      this.blinkTimeline?.kill();
      this.actionTimeline?.kill();
      this.blinkTimeline = null;
      this.actionTimeline = null;
      this.resetValues(0);
    }

    play(type, onComplete) {
      if (!window.gsap || this.reducedMotion || !this.motion || !this.ready) {
        onComplete?.();
        return null;
      }

      const value = this.values;
      const timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          this.actionTimeline = null;
          this.resetValues(0.25);
          onComplete?.();
        },
      });
      this.actionTimeline = timeline;

      if (type === "pet") {
        this.setExpression("happy");
        timeline.to(value, { angleY: -10, bodyY: -5, duration: 0.18 })
          .to(value, { angleY: 5, bodyY: 2, duration: 0.24 });
      } else if (type === "feed") {
        this.setExpression("eat");
        timeline.to(value, { angleZ: -7, mouthOpen: 0.15, duration: 0.18 })
          .to(value, { angleZ: 7, mouthOpen: 0.8, duration: 0.18, repeat: 2, yoyo: true })
          .add(() => this.setExpression("happy"));
      } else if (type === "play" || type === "surprise") {
        this.setExpression("surprised");
        timeline.to(value, { bodyY: -8, leg: 1, shoulder: 1, duration: 0.18 })
          .to(value, { bodyY: 12, angleY: -10, duration: 0.2, ease: "back.out(2)" })
          .to(value, { bodyY: 0, angleY: 0, duration: 0.3, ease: "bounce.out" });
      } else if (type === "dance") {
        this.setExpression("star");
        timeline.to(value, { bodyX: -8, bodyZ: -8, angleZ: 8, armR: 1, duration: 0.24 })
          .to(value, { bodyX: 8, bodyZ: 8, angleZ: -8, armR: -1, armL: 1, duration: 0.28 })
          .to(value, { bodyX: -6, bodyZ: -6, angleZ: 6, armL: -1, duration: 0.24 });
      } else if (type === "sleep") {
        this.setExpression("sleep");
        timeline.to(value, { angleZ: 12, bodyZ: 6, angleY: 8, duration: 0.42 })
          .to(value, { breath: 1, duration: 0.75, repeat: 1, yoyo: true, ease: "sine.inOut" });
      } else if (type === "wave") {
        this.setExpression("happy");
        timeline.to(value, { armR: 1, angleZ: -6, duration: 0.25 })
          .to(value, { armR: -1, duration: 0.16, repeat: 4, yoyo: true });
      } else if (type === "nod") {
        this.setExpression("happy");
        timeline.to(value, { angleY: -18, duration: 0.17 })
          .to(value, { angleY: 8, duration: 0.19 })
          .to(value, { angleY: -12, duration: 0.16 });
      } else if (type === "talk") {
        timeline.to(value, { mouthOpen: 0.65, mouthForm: 0.45, angleZ: -4, duration: 0.16 })
          .to(value, { mouthOpen: 0.1, angleZ: 4, duration: 0.14, repeat: 3, yoyo: true });
      }

      timeline.to({}, { duration: 0.14 });
      return timeline;
    }
  }

  window.HutaoRig = HutaoRig;
})();
