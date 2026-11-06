import React from "react";
import { Composition } from "remotion";
import { Test3D } from "./Test3D";

// Register new shorts here (e.g. a copy of the skill's templates/bridge/ as src/videos/<name>/).
export const Root: React.FC = () => (
  <>
    <Composition id="Test3D" component={Test3D} durationInFrames={150} fps={30} width={1080} height={1920} />
  </>
);
