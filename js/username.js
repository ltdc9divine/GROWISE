(function (root) {
  const usernamePattern = /^[a-z]+-[a-z0-9]+$/;
  const studentUsernamePattern = /^[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+-[a-z0-9]+$/;

  function normalizeFullName(value) {
    if (typeof value !== "string") return "";
    return value.normalize("NFC").trim().replace(/\s+/g, " ");
  }

  function normalizeUsername(value, options = {}) {
    if (typeof value !== "string") {
      return { error: "invalid" };
    }

    const username = value.normalize("NFC").trim().toLowerCase();
    if (options.allowAdmin && username === "admin") {
      return { username: "admin" };
    }

    const pattern = options.allowVietnamese
      ? studentUsernamePattern
      : usernamePattern;
    if (username.length > 64 || !pattern.test(username)) {
      return { error: "invalid" };
    }
    return { username };
  }

  root.GrowiseUsername = Object.freeze({
    normalizeFullName,
    normalizeUsername,
    usernamePattern,
    studentUsernamePattern
  });
})(globalThis);
