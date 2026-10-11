import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLES,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
export interface CaromSnapshot extends Omit<CaromState, "ball"> {
  readonly version: number;
  readonly ball: (BallState & { readonly speed: number }) | null;
}
type Transition = (s: DeepReadonly<CaromState>) => CaromState;
export interface CaromDebugApi {
  readonly version: number;
  clearWorld: Transition;
  spawnBall: Transition;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset: Transition;
  reconcile: Transition;
  setScreen(s: DeepReadonly<CaromState>, x: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, x: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, x: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, x: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    x: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, x: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, x: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, x: Side, y: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, x: Side, y: number): CaromState;
  setPaddleDriven(s: DeepReadonly<CaromState>, x: Side, y: boolean): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, x: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, x: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, x: 1 | -1): CaromState;
  drawBallServeSign: Transition;
  setAiTracking(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(
    s: DeepReadonly<CaromState>,
    index: number,
  ): { x: number; y: number; w: number; h: number } | null;
}
export const BACKGROUND = "#07131f";
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const drawSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const newBall = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: drawSign(),
  trail: [],
});
const newPaddle = (): PaddleState => ({
  cy: FIELD_CY,
  vy: 0,
  driven: false,
  drivenVy: 0,
});
const initial = (muted = false, titleIndex = 0, simTime = 0): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: titleIndex,
  titleIndex,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: { left: newPaddle(), right: newPaddle() },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: newBall(),
  obstacles: OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y })),
  simTime,
  muted,
});
const rect = (screen: Screen, index: number) => {
  const n =
    screen === "title"
      ? 3
      : screen === "paused"
        ? 3
        : screen === "matchover"
          ? 2
          : screen === "howto"
            ? 1
            : 0;
  return index < 0 || index >= n
    ? null
    : { x: 460, y: 340 - (n - 1) * 34 + index * 68, w: 360, h: 48 };
};
const needBall = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw new Error("Carom: no ball is present");
  return s.ball;
};
const patchBall = (
  s: DeepReadonly<CaromState>,
  p: Partial<BallState>,
): CaromState => ({ ...s, ball: { ...needBall(s), ...p } });
const changePaddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  p: PaddleState,
): CaromState => ({ ...s, paddles: { ...s.paddles, [side]: p } });
const title = (s: DeepReadonly<CaromState>) =>
  initial(s.muted, s.titleIndex, s.simTime);
const match = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  mode,
  screen: "countdown",
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: newBall(),
  paddles: {
    left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
  },
});
const move = (
  p: DeepReadonly<PaddleState>,
  want: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + want * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return { ...p, cy, vy: dt > 0 ? (cy - p.cy) / dt : want };
};

function surface(audio?: UpdateApi["audio"]): CaromDebugApi {
  return {
    version: CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...s, ball: newBall() }),
    spawnObstacle: (s, index) => {
      const p = OBSTACLE_CENTERS[index];
      if (!p) throw new Error("Carom: invalid obstacle index");
      return {
        ...s,
        obstacles: [
          ...s.obstacles.filter((o) => o.index !== index),
          { index, cx: p.x, cy: p.y },
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => initial(s.muted),
    reconcile: (s) => ({ ...s }),
    setScreen: (s, screen) => ({ ...s, screen }),
    setMode: (s, mode) => ({ ...s, mode }),
    setMenuIndex: (s, menuIndex) => ({ ...s, menuIndex }),
    setTitleIndex: (s, titleIndex) => ({ ...s, titleIndex }),
    setResumeScreen: (s, resumeScreen) => ({ ...s, resumeScreen }),
    setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...s, winner }),
    setReceiver: (s, receiver) => ({ ...s, receiver }),
    setPaddleCy: (s, side, cy) =>
      changePaddle(s, side, { ...s.paddles[side], cy }),
    setPaddleVy: (s, side, drivenVy) =>
      changePaddle(s, side, { ...s.paddles[side], drivenVy }),
    setPaddleDriven: (s, side, driven) =>
      changePaddle(s, side, { ...s.paddles[side], driven }),
    setBallPosition: (s, x, y) => patchBall(s, { x, y }),
    setBallVelocity: (s, vx, vy) => patchBall(s, { vx, vy }),
    setBallSpin: (s, spin) => patchBall(s, { spin }),
    setBallHeld: (s, held) => patchBall(s, { held }),
    setBallHoldTimer: (s, holdTimer) => patchBall(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => patchBall(s, { serveSign }),
    drawBallServeSign: (s) => patchBall(s, { serveSign: drawSign() }),
    setAiTracking: (s, tracking) => ({ ...s, ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...s, ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => {
      audio?.setMuted(muted);
      return { ...s, muted };
    },
    snapshot: (s) => ({
      ...s,
      version: CAROM_DEBUG_VERSION,
      ball: s.ball && { ...s.ball, speed: Math.hypot(s.ball.vx, s.ball.vy) },
    }),
    menuItemRect: (s, index) => rect(s.screen, index),
  };
}

function paddles(
  s: DeepReadonly<CaromState>,
  a: UpdateApi,
  dt: number,
): CaromState {
  const human = (u: string, d: string) =>
    (a.input.value(d) - a.input.value(u)) * PADDLE_SPEED;
  const lw = s.paddles.left.driven
    ? s.paddles.left.drivenVy
    : human("p1-up", "p1-down") +
      (s.mode === "solo" ? human("p2-up", "p2-down") : 0);
  let rw = 0;
  if (s.paddles.right.driven) rw = s.paddles.right.drivenVy;
  else if (s.mode === "versus") rw = human("p2-up", "p2-down");
  else if (s.ai.movement) {
    const b = s.ball,
      defend = s.screen === "playing" && !!b && b.vx > 0 && s.ai.tracking,
      target = defend ? b.y - b.vy * AI_REACT : AI_HOME_Y,
      dz = defend ? AI_DEADZONE : AI_HOME_DEADZONE,
      d = target - s.paddles.right.cy;
    rw =
      Math.abs(d) <= dz || dt <= 0
        ? 0
        : Math.sign(d) * Math.min(AI_SPEED, Math.abs(d) / dt);
  }
  return {
    ...s,
    paddles: {
      left: move(s.paddles.left, lw, dt),
      right: move(s.paddles.right, rw, dt),
    },
  };
}
type Face = "left" | "right" | "top" | "bottom";
function collide(
  b: BallState,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): [BallState, Face] | null {
  if (!(
    b.x > x0 - BALL_R &&
    b.x < x1 + BALL_R &&
    b.y > y0 - BALL_R &&
    b.y < y1 + BALL_R
  ))
    return null;
  const q: [[number, Face], [number, Face], [number, Face], [number, Face]] = [
    [b.x - (x0 - BALL_R), "left"],
    [x1 + BALL_R - b.x, "right"],
    [b.y - (y0 - BALL_R), "top"],
    [y1 + BALL_R - b.y, "bottom"],
  ];
  const f = q.reduce((v, x) => (x[0] < v[0] ? x : v))[1];
  const n = { ...b };
  if (f === "left") {
    n.x = x0 - BALL_R;
    if (n.vx > 0) n.vx = -n.vx;
  } else if (f === "right") {
    n.x = x1 + BALL_R;
    if (n.vx < 0) n.vx = -n.vx;
  } else if (f === "top") {
    n.y = y0 - BALL_R;
    if (n.vy > 0) n.vy = -n.vy;
  } else {
    n.y = y1 + BALL_R;
    if (n.vy < 0) n.vy = -n.vy;
  }
  return [n, f];
}
function physics(
  s: DeepReadonly<CaromState>,
  a: UpdateApi,
  dt: number,
): CaromState {
  if (!s.ball) return s;
  let b = { ...s.ball };
  const sounds = new Set<string>();
  const n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / MAX_SUBSTEP)),
    h = dt / n;
  for (let i = 0; i < n; i++) {
    const v = Math.hypot(b.vx, b.vy);
    if (v) {
      const z = (b.spin / v) * h,
        co = Math.cos(z),
        si = Math.sin(z);
      b = { ...b, vx: b.vx * co - b.vy * si, vy: b.vx * si + b.vy * co };
    }
    b = {
      ...b,
      spin: b.spin * Math.pow(0.5, h / SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: BALL_R, vy: -b.vy };
      sounds.add(CUES.wallBounce);
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b = { ...b, y: FIELD_H - BALL_R, vy: -b.vy };
      sounds.add(CUES.wallBounce);
    }
    for (const [side, x0, x1, p] of [
      ["left", P1_X0, P1_X1, s.paddles.left],
      ["right", P2_X0, P2_X1, s.paddles.right],
    ] as const) {
      const hit = collide(b, x0, x1, p.cy - PADDLE_HALF, p.cy + PADDLE_HALF);
      if (!hit) continue;
      b = hit[0];
      if (hit[1] === "left" || hit[1] === "right") {
        const theta =
            clamp((b.y - p.cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE,
          v2 = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP),
          dir = side === "left" ? 1 : -1;
        b = {
          ...b,
          x: side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R,
          vx: dir * v2 * Math.cos(theta),
          vy: v2 * Math.sin(theta),
          spin: clamp(
            b.spin + p.vy * SPIN_FROM_PADDLE,
            -SPIN_CLAMP,
            SPIN_CLAMP,
          ),
        };
        sounds.add(CUES.paddleHit);
      } else sounds.add(CUES.wallBounce);
    }
    for (const o of s.obstacles) {
      const r = OBSTACLES[o.index],
        hit = collide(b, r.x0, r.x1, r.y0, r.y1);
      if (hit) {
        b = hit[0];
        sounds.add(CUES.obstacleBounce);
      }
    }
  }
  sounds.forEach((x) => a.audio.play(x));
  if (b.x - BALL_R > FIELD_W || b.x + BALL_R < 0) {
    const who: Side = b.x > FIELD_W ? "left" : "right",
      score = {
        p1: s.score.p1 + (who === "left" ? 1 : 0),
        p2: s.score.p2 + (who === "right" ? 1 : 0),
      };
    a.audio.play(CUES.score);
    if (
      (score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD) ||
      (score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD)
    )
      return {
        ...s,
        score,
        winner: who,
        screen: "matchover",
        menuIndex: 0,
        ball: b,
      };
    return {
      ...s,
      score,
      receiver: who === "left" ? "right" : "left",
      screen: "countdown",
      ball: newBall(),
    };
  }
  const t = s.simTime + dt;
  return {
    ...s,
    ball: {
      ...b,
      trail: [...b.trail, { x: b.x, y: b.y, t }].filter(
        (x) => x.t >= t - TRAIL_TIME,
      ),
    },
  };
}
function menu(s: DeepReadonly<CaromState>, a: UpdateApi): CaromState {
  const list =
    s.screen === "title"
      ? TITLE_ITEMS
      : s.screen === "paused"
        ? PAUSE_ITEMS
        : s.screen === "matchover"
          ? MATCHOVER_ITEMS
          : ["BACK"];
  if (
    s.screen === "howto" &&
    (a.input.pressed("confirm") || a.input.pressed("back"))
  )
    return title(s);
  if (s.screen === "matchover" && a.input.pressed("back")) return title(s);
  if (
    s.screen === "paused" &&
    (a.input.pressed("pause") || a.input.pressed("back"))
  )
    return { ...s, screen: s.resumeScreen };
  let n: CaromState = { ...s };
  if (a.input.pressed("p1-up") || a.input.pressed("p2-up"))
    n = { ...n, menuIndex: (n.menuIndex + list.length - 1) % list.length };
  else if (a.input.pressed("p1-down") || a.input.pressed("p2-down"))
    n = { ...n, menuIndex: (n.menuIndex + 1) % list.length };
  const p = a.input.pointer(),
    hit = list
      .map((_, i) => rect(s.screen, i))
      .findIndex(
        (r) =>
          !!r &&
          p.x >= r.x &&
          p.x <= r.x + r.w &&
          p.y >= r.y &&
          p.y <= r.y + r.h,
      );
  if (hit >= 0) n = { ...n, menuIndex: hit };
  if (!(
    a.input.pressed("confirm") ||
    (a.input.pointerPressed() && a.input.pointerReleased() && hit >= 0)
  ))
    return n;
  if (s.screen === "title") {
    if (n.menuIndex < 2)
      return {
        ...match(n, n.menuIndex === 0 ? "solo" : "versus"),
        titleIndex: n.menuIndex,
      };
    return { ...n, titleIndex: n.menuIndex, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "paused")
    return n.menuIndex === 0
      ? { ...n, screen: s.resumeScreen }
      : n.menuIndex === 1
        ? match(n, s.mode)
        : title(n);
  if (s.screen === "matchover")
    return n.menuIndex === 0 ? match(n, s.mode) : title(n);
  return title(n);
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    ACTIONS.forEach((x) => api.input.register(x, { keys: [...BINDINGS[x]] }));
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 320,
      freqTo: 620,
      gain: 0.13,
      durationMs: 55,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "triangle",
      freq: 210,
      freqTo: 130,
      gain: 0.12,
      durationMs: 45,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "sine",
      freq: 560,
      freqTo: 300,
      gain: 0.12,
      durationMs: 65,
    });
    api.audio.define(CUES.score, {
      wave: "sawtooth",
      freq: 440,
      freqTo: 880,
      gain: 0.14,
      durationMs: 140,
    });
    const d = (
      n: string,
      f: (s: DeepReadonly<CaromState>) => string | number | boolean,
    ) => api.diagnostics.register(n, f);
    d("screen", (s) => s.screen);
    d("mode", (s) => s.mode);
    d("p1 score", (s) => s.score.p1);
    d("p2 score", (s) => s.score.p2);
    d("ball x", (s) => s.ball?.x ?? -1);
    d("ball y", (s) => s.ball?.y ?? -1);
    d("ball vx", (s) => s.ball?.vx ?? 0);
    d("ball vy", (s) => s.ball?.vy ?? 0);
    d("ball speed", (s) => (s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0));
    d("ball spin", (s) => s.ball?.spin ?? 0);
    d("left cy", (s) => s.paddles.left.cy);
    d("left vy", (s) => s.paddles.left.vy);
    d("right cy", (s) => s.paddles.right.cy);
    d("right vy", (s) => s.paddles.right.vy);
    return [initial(), surface()];
  },
  update(state, a, dt) {
    let s: CaromState = {
      ...state,
      simTime: state.simTime + dt,
      muted: a.audio.muted(),
    };
    if (a.input.pressed("mute")) {
      a.audio.setMuted(!a.audio.muted());
      s = { ...s, muted: a.audio.muted() };
    }
    if (["title", "howto", "paused", "matchover"].includes(s.screen))
      return menu(s, a);
    if (a.input.pressed("pause"))
      return {
        ...s,
        resumeScreen: s.screen as "countdown" | "playing",
        screen: "paused",
        menuIndex: 0,
      };
    s = paddles(s, a, dt);
    if (!s.ball) return s;
    if (s.screen === "countdown") {
      const hold = s.ball.holdTimer - dt;
      if (hold <= 0) {
        const dir = s.receiver === "left" ? -1 : 1;
        return {
          ...s,
          screen: "playing",
          ball: {
            ...s.ball,
            held: false,
            holdTimer: 0,
            vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
            vy: s.ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
            trail: [],
          },
        };
      }
      const t = s.simTime;
      return {
        ...s,
        ball: {
          ...s.ball,
          holdTimer: hold,
          trail: [...s.ball.trail, { x: s.ball.x, y: s.ball.y, t }].filter(
            (x) => x.t >= t - TRAIL_TIME,
          ),
        },
      };
    }
    return physics(s, a, dt);
  },
  render(s, a) {
    const c = a.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, FIELD_W, FIELD_H);
    c.strokeStyle = "#1d4960";
    c.lineWidth = 2;
    c.setLineDash([12, 14]);
    c.beginPath();
    c.moveTo(NET_X, 42);
    c.lineTo(NET_X, FIELD_H - 42);
    c.stroke();
    c.setLineDash([]);
    const bar = (x: number, y: number, w: number, h: number, color: string) => {
      c.fillStyle = color;
      c.beginPath();
      c.roundRect(x, y, w, h, 8);
      c.fill();
    };
    s.obstacles.forEach((o) => bar(o.cx - 10, o.cy - 70, 20, 140, "#f2b84b"));
    bar(
      P1_X0,
      s.paddles.left.cy - PADDLE_HALF,
      P1_X1 - P1_X0,
      PADDLE_HALF * 2,
      "#49d5ff",
    );
    bar(
      P2_X0,
      s.paddles.right.cy - PADDLE_HALF,
      P2_X1 - P2_X0,
      PADDLE_HALF * 2,
      "#ff5e8a",
    );
    if (s.ball) {
      c.strokeStyle = "rgba(237,250,255,.38)";
      c.lineWidth = 5;
      c.lineCap = "round";
      c.beginPath();
      s.ball.trail.forEach((p, i) =>
        i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y),
      );
      c.stroke();
      c.fillStyle = "#f7fcff";
      c.beginPath();
      c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      c.fill();
    }
    const text = (x: string, y: number, size: number, color = "#dceefa") => {
      c.fillStyle = color;
      c.font = `700 ${size}px system-ui,sans-serif`;
      c.textAlign = "center";
      c.fillText(x, 640, y);
    };
    if (["playing", "countdown", "paused", "matchover"].includes(s.screen)) {
      c.textAlign = "center";
      c.fillStyle = "#49d5ff";
      c.font = "700 34px system-ui";
      c.fillText(String(s.score.p1).padStart(2, "0"), 530, 70);
      c.fillStyle = "#ff5e8a";
      c.fillText(String(s.score.p2).padStart(2, "0"), 750, 70);
      text(
        s.mode === "solo" ? "SOLO // FIRST TO 11" : "VERSUS // FIRST TO 11",
        105,
        13,
        "#78a0b4",
      );
    }
    if (s.screen === "title") {
      text(TITLE_TEXT, 205, 72, "#f7fcff");
      text("A SPIN-DRIVEN TABLE DUEL", 238, 14, "#7fa9bd");
    }
    if (s.screen === "howto") {
      text("HOW TO PLAY", 190, 42);
      text("W / S moves cyan.  ↑ / ↓ moves pink in Versus.", 260, 17);
      text(
        "Move as you strike to curve shots around the amber blockers.",
        292,
        17,
        "#f2d48c",
      );
    }
    if (s.screen === "countdown") text("SERVE", 300, 26, "#f2b84b");
    if (s.screen === "paused") text("PAUSED", 210, 46);
    if (s.screen === "matchover") {
      text(
        s.winner === "left" ? "CYAN WINS" : "PINK WINS",
        210,
        42,
        s.winner === "left" ? "#49d5ff" : "#ff5e8a",
      );
      text(`${s.score.p1}  —  ${s.score.p2}`, 248, 24);
    }
    const list =
      s.screen === "title"
        ? TITLE_ITEMS
        : s.screen === "paused"
          ? PAUSE_ITEMS
          : s.screen === "matchover"
            ? MATCHOVER_ITEMS
            : s.screen === "howto"
              ? ["BACK TO MENU"]
              : [];
    list.forEach((x, i) => {
      const r = rect(s.screen, i)!;
      if (i === s.menuIndex) {
        c.fillStyle = "#173b50";
        c.fillRect(r.x, r.y, r.w, r.h);
        c.strokeStyle = "#68d7f8";
        c.strokeRect(r.x, r.y, r.w, r.h);
      }
      text(x, r.y + 32, 20, i === s.menuIndex ? "#fff" : "#9bc0d0");
    });
  },
};
