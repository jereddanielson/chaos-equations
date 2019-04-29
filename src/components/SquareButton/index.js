import React from "react";

export default function SquareButton(props) {
  return (
    <button
      alt={props.alt}
      onClick={props.onClick}
      style={{
        WebkitAppearance: "none",
        outline: "none",
        border: "none",
        background: "rgb(0, 144, 255)",
        width: props.size,
        height: props.size,
        padding: 0,
        margin: 0,
        display: "block",
        position: "relative",
        fontWeight: "bold",
        ...props.style
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        {props.children}
      </span>
    </button>
  );
}
