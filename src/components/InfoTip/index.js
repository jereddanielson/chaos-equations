import React from "react";
import "./index.css";

export default function InfoTip(props) {
  return (
    <div
      className="chaos-info-tip"
      style={{ position: "relative", display: "inline-block" }}
    >
      <span className="icon-info" />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "1rem",
          height: "1rem",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="chaos-info-tip-inner"
        style={{
          userSelect: "none",
          pointerEvents: "none",
          position: "absolute",
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
