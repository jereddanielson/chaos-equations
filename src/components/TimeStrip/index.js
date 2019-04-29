import React from "react";

export default function TimeStrip(props) {
  const [time, setTime] = React.useState(0);
  React.useEffect(() => {
    const handleSetTime = t => {
      setTime(t);
    };

    window.CHAOS_TIME.addEventListener("set", handleSetTime);

    return function cleanUp() {
      window.CHAOS_TIME.removeEventListener("set", handleSetTime);
    };
  }, []);
  const formattedTime = time.toFixed(4);
  const currentRatio = Math.abs(time - props.tMin) / (props.tMax - props.tMin);

  const setNewT = e => {
    const barWidth = e.target.offsetWidth;
    const clickPos = e.clientX;
    const newT = (clickPos / barWidth) * (props.tMax - props.tMin) + props.tMin;
    window.CHAOS_TIME.set(newT);
    window.CHAOS_TIME.skip();
  };

  return (
    <div
      onMouseDown={e => {
        e.preventDefault();
        setNewT(e);
        window.CHAOS_TIME.pause();
      }}
      onMouseMove={e => {
        e.preventDefault();
        if (window.CHAOS_TIME.paused) {
          setNewT(e);
        }
      }}
      onMouseUp={e => {
        e.preventDefault();
        // setNewT(e);
        window.CHAOS_TIME.play();
      }}
      onTouchStart={e => {
        // e.preventDefault();
        setNewT(e.touches[0]);
        window.CHAOS_TIME.pause();
      }}
      onTouchMove={e => {
        // e.preventDefault();
        if (window.CHAOS_TIME.paused) {
          setNewT(e.touches[0]);
        }
      }}
      onTouchEnd={e => {
        // e.preventDefault();
        // setNewT(e.touches[0]);
        window.CHAOS_TIME.play();
      }}
      onMouseLeave={() => {
        window.CHAOS_TIME.play();
      }}
      style={{
        width: "100%",
        height: 32,
        background: "rgba(0, 144, 255, 0.25)",
        cursor: "ew-resize",
      }}
    >
      <div
        style={{
          background: "rgba(0, 144, 255, 0.5)",
          width: `${currentRatio * 100}%`,
          height: "100%",
          position: "relative",
          borderRight: "2px solid rgb(0, 144, 255)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: 0,
            transform: `translate(${currentRatio <= 0.5 ? 100 : 0}%, -50%)`,
            transition: "transform 0.3s ease-out",
            padding: "0 16px",
            userSelect: "none",
          }}
        >
          t = {formattedTime}
        </div>
      </div>
    </div>
  );
}
