import React from "react";
import "./index.css";

export default function Slider(props) {
  const { min, max, step, value, onChange } = props;
  return (
    <div style={{ display: "flex", cursor: "pointer" }}>
      <input
        type="range"
        className="chaos-slider"
        {...{ min, max, step, value, onChange }}
      />
      <span style={{ marginLeft: "0.5rem" }}>{props.children}</span>
    </div>
  );
}
