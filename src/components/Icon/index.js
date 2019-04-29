import React from "react";
import "./index.css";

export default function Icon(props) {
  return (
    <button
      className="chaos-icon"
      onClick={props.onClick}
      style={{
        display: "inline-flex",
        height: "2rem",
        width: "2rem",
        userSelect: "none",
        cursor: "pointer",
        outline: "none",
        padding: 0,
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        fontSize: "1.5rem",
        ...props.style,
      }}
    >
      {props.children}
    </button>
  );
}
