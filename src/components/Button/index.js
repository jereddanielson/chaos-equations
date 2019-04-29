import React from "react";
import "./index.css";

export default function Button(props) {
  return (
    <button
      className="chaos-button"
      alt={props.alt}
      onClick={props.onClick}
      style={{
        WebkitAppearance: "none",
        outline: "none",
        border: "none",
        borderBottom: `1px solid rgba(0, 144, 255, ${props.active ? 1 : 0.5})`,
        padding: "0.25rem 0.5rem",
        margin: 0,
        display: "inline-flex",
        position: "relative",
        fontWeight: props.active ? "bold" : "normal",
        ...props.style
      }}
    >
      {props.children}
    </button>
  );
}
