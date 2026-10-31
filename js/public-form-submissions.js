(function (root) {
  class FormSubmissionError extends Error {
    constructor(code) {
      super(code);
      this.name = "FormSubmissionError";
      this.code = code;
    }
  }

  function createClient(config, options = {}) {
    const fetcher = options.fetch || root.fetch?.bind(root);
    const endpoint = typeof config?.url === "string" && config.url
      ? `${config.url.replace(/\/+$/, "")}/functions/v1/submit-website-form`
      : null;

    async function submit(action, payload) {
      if (!["consultation", "feedback"].includes(action)) {
        throw new FormSubmissionError("invalid_form");
      }
      if (!endpoint || !config?.publishableKey || !fetcher) {
        throw new FormSubmissionError("service_unavailable");
      }

      let response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            apikey: config.publishableKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ...payload, action })
        });
      } catch {
        throw new FormSubmissionError("network_error");
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new FormSubmissionError("service_unavailable");
      }
      if (!response.ok) {
        const code = typeof result?.error === "string" ? result.error : "";
        if (code === "rate_limited") {
          throw new FormSubmissionError("rate_limited");
        }
        if (code === "invalid_form") {
          throw new FormSubmissionError("invalid_form");
        }
        throw new FormSubmissionError("submission_unavailable");
      }
      if (result?.success !== true) {
        throw new FormSubmissionError("service_unavailable");
      }
      return result;
    }

    return Object.freeze({ submit });
  }

  root.GrowiseFormSubmissions = Object.freeze({
    FormSubmissionError,
    createClient
  });
})(globalThis);
