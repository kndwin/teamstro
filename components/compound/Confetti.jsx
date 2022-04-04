import React from "react";
import RConfetti from "react-confetti";
import { useViewportSize } from "@mantine/hooks";

export function Confetti(props) {
  const { width, height } = useViewportSize();
  return (
    <RConfetti
      width={width}
      height={height}
      numberOfPieces={300}
      recycle={false}
      {...props}
    />
  );
}
