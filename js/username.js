(function (root) {
  const usernamePattern = /^[a-z]+-[a-z0-9]+$/;

  function normalizeName(value) {
    return value
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }

  function normalizeUsername(value, options = {}) {
    if (typeof value !== "string") {
      return { error: "invalid" };
    }

    if (options.allowAdmin && value.trim().toLowerCase() === "admin") {
      return { username: "admin" };
    }

    const parts = value.split("-");
    if (parts.length !== 2) {
      return { error: "invalid" };
    }

    const name = normalizeName(parts[0]);
    const studentId = parts[1].toLowerCase();
    if (!name || !/^[a-z0-9]+$/.test(studentId)) {
      return { error: "invalid" };
    }

    const username = `${name}-${studentId}`;
    if (username.length > 64 || !usernamePattern.test(username)) {
      return { error: "invalid" };
    }
    return { username };
  }

  root.GrowiseUsername = Object.freeze({ normalizeUsername, usernamePattern });
})(globalThis);
