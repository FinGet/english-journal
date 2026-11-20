import React from "react";
import { AbsoluteFill, Composition } from "remotion";

const Blank: React.FC = () => <AbsoluteFill style={{ backgroundColor: "white" }} />;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Blank"
      component={Blank}
      durationInFrames={60}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
