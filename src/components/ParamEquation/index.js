import React from "react";
import { paramsDimensions, paramsOrder } from "../ChaosRenderer/constants.js";

const nullSymbol = "∅";

const paramSortOrder = ["x", "y", "t", "xy", "xt", "yt", "xx", "yy", "tt"];

function paramSort(a, b) {
  return paramSortOrder.indexOf(a) - paramSortOrder.indexOf(b);
}

// This is super hacky but getting text aligned with the slick transition between hover states is tricky
function InvisibleExponent() {
  return (
    <sup style={{ width: 0, display: "inline-block", visibility: "hidden" }}>
      2
    </sup>
  );
}

function ParamSegment({
  isFirst = false,
  isHovered = false,
  dimension = "",
  varName = "",
  varValue = 0,
  onClick = (
    dimension = "",
    varName = "",
    varValue = 0,
    incrementValue = 0
  ) => {},
}) {
  const [signWidth, setSignWidth] = React.useState(0);
  const [nameWidth, setNameWidth] = React.useState(0);
  const signRef = React.useRef(null);
  const nameRef = React.useRef(null);
  const isVisible = isHovered || varValue !== 0;

  // Calculate width based on phantom nodes
  React.useLayoutEffect(() => {
    if (signRef.current) {
      setSignWidth(signRef.current.offsetWidth);
    }
    if (nameRef.current) {
      setNameWidth(nameRef.current.offsetWidth);
    }
  }, [varValue, isHovered, isFirst]);

  // Make sign correct
  let sign = "";
  if (isFirst) {
    if (varValue === -1) {
      sign = "-";
    } else if (varValue === 1 && isHovered) {
      sign = "+";
    } else if (varValue === 0 && isHovered) {
      sign = nullSymbol;
    }
  } else {
    if (varValue === -1) {
      sign = " - ";
    } else if (varValue === 1) {
      sign = " + ";
    } else {
      sign = ` ${nullSymbol} `;
    }
  }

  // Some style stuff
  let opacity = 0;
  let color = "inherit";
  if (varValue !== 0) {
    opacity = 1;
  } else if (isHovered) {
    opacity = 0.75;
    color = "red";
  }

  // Add superscript number for exponents
  let varNameWithExponent = varName;
  if (varName.length > 1 && varName[0] === varName[1]) {
    varNameWithExponent = (
      <div style={{ position: "relative" }}>
        {varName[0]}
        <sup>2</sup>
      </div>
    );
  }

  const handleOnClick = React.useCallback(() => {
    onClick(dimension, varName, varValue, 1);
  }, [varValue]);

  const handleOnContextMenu = React.useCallback(() => {
    onClick(dimension, varName, varValue, -1);
  }, [varValue]);

  return (
    <div
      className="paramSegment"
      style={{
        opacity,
        color,
        transition: "all .3s cubic-bezier(0.250, 0.250, 0.250, 1.000)",
        position: "relative",
        display: "flex",
        flexDirection: "row",
      }}
      onClick={handleOnClick}
      onContextMenu={handleOnContextMenu}
    >
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            width: isVisible ? signWidth : 0,
            overflow: "hidden",
            transition: "width .3s cubic-bezier(0.250, 0.250, 0.250, 1.000)",
            position: "relative",
          }}
        >
          <div
            style={{
              left: "50%",
              position: "absolute",
              transform: "translateX(-50%)",
            }}
          >
            {sign}
            <InvisibleExponent />
          </div>
        </div>
        <div
          style={{
            width: isVisible ? nameWidth : 0,
            overflow: "hidden",
            transition: "width .3s cubic-bezier(0.250, 0.250, 0.250, 1.000)",
            position: "relative",
          }}
        >
          <div
            style={{
              left: "50%",
              position: "absolute",
              transform: "translateX(-50%)",
            }}
          >
            {varNameWithExponent}
            <InvisibleExponent />
          </div>
        </div>
      </div>
      <div
        ref={signRef}
        style={{ position: "absolute", left: 0, top: 0, visibility: "hidden" }}
      >
        {sign}
        <InvisibleExponent />
      </div>
      <div
        ref={nameRef}
        style={{ position: "absolute", left: 0, top: 0, visibility: "hidden" }}
      >
        {varNameWithExponent}
        <InvisibleExponent />
      </div>
    </div>
  );
}

export default function ParamEquation({ params, onClick }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const dimensionVarNames = Object.keys(params);
  const dimensionLines = [];

  // Iterate over every dimension variable name (e.g. X, Y)
  // Each dimension will become one line in the param equation display
  dimensionVarNames.forEach((varName) => {
    // Cycle through each subparameter of the dimension, (e.g. t, tt, x, xy, xt, xx, y, yt, yy)
    const subparamNamesUnsorted = Object.keys(params[varName]);

    const subparamNames = subparamNamesUnsorted.sort(paramSort);

    let hasRenderedFirst = false;

    const subparamElements = subparamNames.map((subparamVarName, i) => {
      const varValue = params[varName][subparamVarName];

      // Only set isFirst param for first non-zero param value
      // Unless hovered, then isFirst is the first index
      let isFirst = false;
      if (isHovered) {
        isFirst = i === 0;
      } else {
        if (!hasRenderedFirst && varValue !== 0) {
          isFirst = true;
          hasRenderedFirst = true;
        }
      }

      return (
        <ParamSegment
          key={subparamVarName}
          isFirst={isFirst}
          isHovered={isHovered}
          dimension={varName}
          varName={subparamVarName}
          varValue={varValue}
          onClick={onClick}
        />
      );
    });

    dimensionLines.push({
      varName,
      subparamElements,
    });
  });

  const onMouseEnter = React.useCallback(() => {
    setIsHovered(true);
  }, [setIsHovered]);

  const onMouseLeave = React.useCallback(() => {
    setIsHovered(false);
  }, [setIsHovered]);

  return (
    <div
      style={{
        padding: "0.5rem",
        whiteSpace: "pre",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {dimensionLines.map((ea) => {
        return (
          <div
            key={ea.varName}
            style={{
              margin: "0.25rem 0",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <span>
              {ea.varName}: <InvisibleExponent />
            </span>
            {ea.subparamElements}
          </div>
        );
      })}
    </div>
  );
}
