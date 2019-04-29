import React from "react";
import "./index.css";

export default function Checkbox(props) {
  return (
    <label
      className="chaos-checkbox-label"
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <input
        value={props.value}
        onChange={props.onChange}
        type="checkbox"
        style={{
          width: 0,
          height: 0,
          margin: 0,
          padding: 0,
          outline: 0,
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      />
      <div
        className={`chaos-checkbox ${props.value ? "active" : ""}`}
        style={{
          width: "1rem",
          height: "1rem",
          marginRight: "0.5rem",
        }}
      />
      {props.children}
    </label>
  );
}
