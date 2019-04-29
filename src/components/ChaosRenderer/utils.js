import { paramsDimensions, paramsOrder } from "./constants";

/**
 * Params for the x or y dimension.
 * Each value should be either -1, 0, or 1
 * @typedef {object} DimensionParams
 * @property {number} xx x^2
 * @property {number} yy y^2
 * @property {number} tt t^2
 * @property {number} xy x*y
 * @property {number} xt x*t
 * @property {number} yt y*t
 * @property {number} x y
 * @property {number} y y
 * @property {number} t t
 */

/**
 * Combines DimensionParams into object representing both x and y
 * @typedef {object} Params
 * @property {DimensionParams} x X dimension parameters
 * @property {DimensionParams} y Y dimension parameters
 */

/**
 * Converts parameters object to encoded string
 * @param {Params} params Parameters object to parse
 * @returns {string}
 */
export function paramsToString(params) {
  const paramsSafe = {};
  for (let i = 0; i < paramsDimensions.length; i++) {
    paramsSafe[paramsDimensions[i]] = params[paramsDimensions[i]] || {};
  }
  const base27 = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let a = 0;
  let n = 0;
  let result = "";
  for (let d = 0; d < paramsDimensions.length; d++) {
    for (let i = 0; i < paramsOrder.length; ++i) {
      a =
        a * 3 +
        parseInt(paramsSafe[paramsDimensions[d]][paramsOrder[i]] || 0) +
        1;
      n += 1;
      if (n == 3) {
        result += base27[a];
        a = 0;
        n = 0;
      }
    }
  }
  return result;
}

/**
 * Decodes string to parameterized representation
 * @param {string} str Encoded string to parse
 * @returns {Params}
 */
export function stringToParams(str) {
  const params = [];
  for (let i = 0; i < Math.floor(18 / 3); ++i) {
    let a = 0;
    const c = i < str.length ? str[i] : "_";
    if (c >= "A" && c <= "Z") {
      a = Math.floor(c.charCodeAt(0) - 65) + 1;
    } else if (c >= "a" && c <= "z") {
      a = Math.floor(c.charCodeAt(0) - 97) + 1;
    }
    params[i * 3 + 2] = (a % 3) - 1.0;
    a = Math.floor(a / 3);
    params[i * 3 + 1] = (a % 3) - 1.0;
    a = Math.floor(a / 3);
    params[i * 3 + 0] = (a % 3) - 1.0;
  }
  const result = {};
  for (let d = 0; d < paramsDimensions.length; d++) {
    result[paramsDimensions[d]] = {};
    for (let i = 0; i < paramsOrder.length; ++i) {
      result[paramsDimensions[d]][paramsOrder[i]] =
        params[d * paramsOrder.length + i];
    }
  }
  return result;
}

export function generateRandomParams() {
  const result = {};
  paramsDimensions.forEach(eaDim => {
    result[eaDim] = {};
    paramsOrder.forEach(eaParam => {
      result[eaDim][eaParam] = Math.floor(Math.random() * 3) - 1;
    });
  });
  return result;
}

window.g = generateRandomParams;
