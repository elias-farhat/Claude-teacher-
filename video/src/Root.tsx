import React from "react";
import { Composition } from "remotion";
import { Test3D } from "./Test3D";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { EiffelShort, EIFFEL_FRAMES } from "./videos/eiffel/Eiffel";
import { RatShort, RAT_FRAMES } from "./videos/rats/Rats";
import { MoonShort, MOON_FRAMES } from "./videos/moon/Moon";

// Register new shorts here (e.g. a copy of the skill's templates/bridge/ as src/videos/<name>/).
export const Root: React.FC = () => (
  <>
    <Composition id="Test3D" component={Test3D} durationInFrames={150} fps={30} width={1080} height={1920} />
    {/* Copy of the skill's templates/bridge/ (only change: quality() for preview + a [kenney] load log line). */}
    <Composition id="EiffelShort" component={EiffelShort} durationInFrames={EIFFEL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="RatShort" component={RatShort} durationInFrames={RAT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MoonShort" component={MoonShort} durationInFrames={MOON_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
