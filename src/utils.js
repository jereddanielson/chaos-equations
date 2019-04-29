export function getURLParams() {
  const params = decodeURI(window.location.search)
    .replace(/\?/, "")
    .split("&");
  const result = {};
  params.forEach(ea => {
    const kv = ea.split("=");
    if (kv.length === 2) {
      result[kv[0]] = kv[1];
    }
  });
  return result;
}

export function sanitizeParamString(str) {
  return typeof str === "string"
    ? str
        .substr(0, 6)
        .toUpperCase()
        .replace(/[^A-Z_]/g, "")
    : "";
}
