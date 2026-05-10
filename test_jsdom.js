const { JSDOM } = require('jsdom');
JSDOM.fromURL('https://luxury-ecommerce-xi.vercel.app/', { 
    runScripts: 'dangerously', 
    resources: 'usable' 
}).then(dom => { 
    const window = dom.window;
    window.addEventListener('error', e => console.log('ERROR:', e.message));
    window.addEventListener('unhandledrejection', e => console.log('REJECTION:', e.reason));
    window.console.error = (...args) => console.log('CONSOLE.ERROR:', ...args);
    window.console.warn = (...args) => console.log('CONSOLE.WARN:', ...args);
    window.console.log = (...args) => console.log('CONSOLE.LOG:', ...args);
    setTimeout(() => { 
        console.log('HTML SNIPPET:', window.document.body.innerHTML.substring(0, 1000)); 
        process.exit(0); 
    }, 5000); 
}).catch(console.error);
