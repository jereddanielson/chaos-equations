import React from "react";
import { paramsDimensions, paramsOrder } from "../ChaosRenderer/constants.js";

function pushParamToken(strArr = [], varName, varValue) {
  const varNameComputed =
    varName.substr(0, 1) === varName.substr(1, 1) ? (
      <span>
        {varName.substr(0, 1)}
        <sup>2</sup>
      </span>
    ) : (
      varName
    );
  if (varValue !== 0) {
    strArr.push(
      <span key={varName}>
        {varValue > 0 ? (
          strArr.length === 0 ? (
            varNameComputed
          ) : (
            <span>
              {` + `}
              {varNameComputed}
            </span>
          )
        ) : strArr.length === 0 ? (
          <span>
            {`-`}
            {varNameComputed}
          </span>
        ) : (
          <span>
            {` - `}
            {varNameComputed}
          </span>
        )}
      </span>
    );
  }
}

export default function ParamEquation(props) {
  const { params } = props;
  const paramsEquations = {};
  paramsDimensions.forEach(eaDimension => {
    paramsEquations[eaDimension] = [];
    paramsOrder.forEach(eaParam => {
      pushParamToken(
        paramsEquations[eaDimension],
        eaParam,
        params[eaDimension][eaParam]
      );
    });
    if (paramsEquations[eaDimension].length === 0) {
      paramsEquations[eaDimension].push("0");
    }
  });
  return (
    <div style={{ padding: "0.5rem", width: 0, whiteSpace: "nowrap" }}>
      {Object.keys(paramsEquations).map((ea, i) => {
        return (
          <div key={`${ea}`} style={{ margin: "0.25rem 0" }}>
            {paramsDimensions[i]}: <span>{paramsEquations[ea]}</span>
          </div>
        );
      })}
    </div>
  );
}
