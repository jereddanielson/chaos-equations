import React from "react";
import "./index.css";

export default function TextInput(props) {
  const inputRef = React.useCallback(
    el => {
      props.autoFocused && el && el.focus();
      props.autoSelected && el && el.select();
    },
    [props.autoFocused]
  );

  return (
    <input
      className="chaos-text-input"
      type="text"
      spellCheck={false}
      value={props.value}
      ref={inputRef}
      alt={props.alt}
      onKeyDown={props.onKeyDown}
      onChange={props.onChange}
      style={{
        fontSize: "1.5rem",
        WebkitAppearance: "none",
        outline: "none",
        ...props.style
      }}
    />
  );
}
