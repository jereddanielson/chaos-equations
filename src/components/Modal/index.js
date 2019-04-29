import React from "react";

export default function Modal(props) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, .5)",
          zIndex: 200,
        }}
        onClick={props.onClose}
      />
      <div
        style={{
          position: "relative",
          zIndex: 300,
          color: "#eee",
          width: 640,
          maxWidth: "100%",
          maxHeight: "100%",
          padding: "1rem",
          margin: "1rem",
          border: "1px solid rgba(0, 144, 255, 0.5)",
          background: "black",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div>
            <strong>{props.title}</strong>
          </div>
          <div
            onClick={props.onClose}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <span>x</span>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: "translate(-50%, -50%)",
                width: "2rem",
                height: "2rem",
              }}
            />
          </div>
        </div>
        <div>{props.children}</div>
      </div>
    </div>
  );
}
