import { describe, expect, it } from "vitest";
import type { InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import { game, type CaromDebugApi, type CaromState } from "./game";

const init = () => {
  const registered: string[] = [];
  const api = {
    input: {
      register: (name: string) => registered.push(name),
      layout: () => null,
    },
    audio: { define: () => undefined, load: async () => undefined },
    diagnostics: { register: () => undefined },
    assets: {},
    events: {},
    viewport: () => ({}),
  } as unknown as InitApi<never>;
  return {
    pair: game.initialize(api) as [CaromState, CaromDebugApi],
    registered,
  };
};

const updateApi = () =>
  ({
    input: {
      value: () => 0,
      pressed: () => false,
      pointer: () => ({
        x: 0,
        y: 0,
        down: false,
        device: "mouse",
        buttons: [],
      }),
      pointerPressed: () => false,
      pointerReleased: () => false,
      pointerSamples: () => [],
      pointerContacts: () => [],
      wheel: () => ({ x: 0, y: 0 }),
    },
    audio: {
      muted: () => false,
      setMuted: () => undefined,
      play: () => undefined,
    },
    frame: () => ({ count: 0, timeMs: 0, lastDeltaMs: 0 }),
    viewport: () => ({}),
  }) as unknown as UpdateApi;

describe("Carom", () => {
  it("registers its controls and initializes a complete title world", () => {
    const { pair, registered } = init();
    expect(registered).toHaveLength(8);
    expect(pair[0].screen).toBe("title");
    expect(pair[1].snapshot(pair[0]).ball?.held).toBe(true);
    expect(pair[0].obstacles).toHaveLength(2);
  });

  it("serves after the countdown and preserves immutable poses", () => {
    const [state, debug] = init().pair;
    const ready = debug.setScreen(state, "countdown");
    const served = game.update(ready, updateApi(), 1.01);
    expect(served.screen).toBe("playing");
    expect(served.ball?.held).toBe(false);
    expect(Math.abs(served.ball?.vx ?? 0)).toBeGreaterThan(500);
    expect(state.screen).toBe("title");
  });
});
