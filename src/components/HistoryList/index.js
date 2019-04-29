import React from "react";
import "./index.css";

export function HistoryItem(props) {
  return (
    <div style={{ cursor: "pointer", margin: "0.25rem 0" }}>
      <span
        className={`chaos-history-item ${props.active && "active"}`}
        onClick={props.onClick}
      >
        {props.children}
      </span>
    </div>
  );
}

export function HistoryList(props) {
  return <div>{props.children}</div>;
}
