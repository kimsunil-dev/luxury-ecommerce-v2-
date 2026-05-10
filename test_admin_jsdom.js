const { JSDOM } = require('jsdom');
JSDOM.fromURL('https://luxury-ecommerce-xi.vercel.app/admin.html', { 
    runScripts: 'dangerously', 
    resources: 'usable' 
}).then(dom => { 
    const window = dom.window;
    window.addEventListener('error', e => console.log('ERROR:', e.message, e.filename, e.lineno));
    window.addEventListener('unhandledrejection', e => console.log('REJECTION:', e.reason));
    window.console.error = (...args) => console.log('CONSOLE.ERROR:', ...args);
    
    setTimeout(() => { 
        console.log('Finished waiting. Right pane exists?', !!window.document.querySelector('.admin-section')); 
        process.exit(0); 
    }, 5000); 
}).catch(console.error);
