import React from "react";
import SquareButton from "../SquareButton";
import TextInput from "../TextInput";
import { sanitizeParamString } from "../../utils";

export default function EditableValue(props) {
  const [editing, setEditing] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(props.value);

  function handleSave(e) {
    e.preventDefault();
    if (draftValue.length === 6) {
      props.onSave && props.onSave(draftValue || props.value);
      setEditing(false);
    }
  }

  function handleCancel(e) {
    e.stopPropagation();
    setEditing(false);
    setDraftValue("");
  }

  function handleEditStart() {
    setEditing(true);
    setDraftValue(props.value);
  }

  const sharedStyle = {
    position: "relative",
    padding: "0.5rem",
    border: "1px solid rgba(0, 144, 255, 0.5)",
    borderRadius: 2,
    fontSize: "1.5rem",
    height: "100%",
    lineHeight: "2rem",
    width: "6.5rem",
  };

  return (
    <div
      onClick={() => {
        !editing && handleEditStart();
      }}
      style={{
        position: "relative",
        height: "3rem",
        cursor: "pointer",
      }}
    >
      {!editing && (
        <div
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === " " || e.key === "Enter") {
              handleEditStart();
            }
          }}
          style={sharedStyle}
        >
          {props.value}
        </div>
      )}
      {editing && (
        <form
          onSubmit={handleSave}
          style={{
            position: "relative",
            zIndex: 20,
            height: "100%",
            display: "inline-flex",
          }}
        >
          <TextInput
            autoFocused
            autoSelected
            alt="Parameter string input"
            value={draftValue}
            onKeyDown={e => {
              if (e.key === "Escape") {
                handleCancel(e);
              }
            }}
            onChange={e => {
              setDraftValue(sanitizeParamString(e.target.value));
            }}
            style={sharedStyle}
          />
          <SquareButton
            alt="Confirm new parameter string"
            onClick={handleSave}
            size="3rem"
          >
            Save
          </SquareButton>
        </form>
      )}
      {editing && props.exclusive && (
        <div
          style={{
            position: "fixed",
            zIndex: 10,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={handleCancel}
        />
      )}
    </div>
  );
}
