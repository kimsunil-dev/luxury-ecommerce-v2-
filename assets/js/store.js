window.addEventListener('error', function(e) {
    if (e.message === 'Script error.' && !e.filename) return; // Ignore opaque/extension errors
    if (e.message && e.message.includes('Script error.') && e.lineno === 0) return;
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:50px;left:0;background:red;color:white;z-index:9999;padding:20px;font-size:16px;width:100%;box-sizing:border-box;box-shadow:0 4px 10px rgba(0,0,0,0.3);";
    errDiv.innerText = `JS ERROR: ${e.message} at ${e.filename}:${e.lineno}`;
    document.body.appendChild(errDiv);
}
});
window.addEventListener('unhandledrejection', function(e) {
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:100px;left:0;background:orange;color:white;z-index:9999;padding:20px;font-size:16px;width:100%;box-sizing:border-box;";
    errDiv.innerText = `PROMISE REJECTION: ${e.reason}`;
    document.body.appendChild(errDiv);
}
});

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

import { getProducts, getSettings } from './modules/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
    const products = await getProducts();
    const appContent = document.getElementById('app-content');
    
    if(!appContent) return;
    appContent.innerHTML = '';

    // Inject Fullscreen Modal
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <button class="modal-close">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="modal-content-wrapper"></div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.querySelector('.modal-content-wrapper').innerHTML = ''; // Stop video if any
            document.body.style.overflow = '';
        }, 300);
    }
});

    // Settings 가?�오�?
    const settings = await getSettings();
    
    // 미디??(비디???��?지) ?�동 ?�별 ?�더??
    function renderMedia(src, alt) {
        if (!src || typeof src !== 'string') return '';
        if (src.startsWith('data:video')) {
            return `<video src="${src}" autoplay loop muted playsinline class="lookbook-media"></video>`;
        } else {
            return `<img src="${src}" alt="${alt}" class="lookbook-media">`;
        }
    }

    // ?�이???�효??보장
    const lb = settings.lookbook || {};
    const perksList = Array.isArray(settings.perks) ? settings.perks : [
        { title: 'Worldwide Instant Exchanges', desc: 'Easy online size swaps' },
        { title: 'Express Global Shipping', desc: 'Complimentary on orders over $400USD' },
        { title: 'SIR. Loyalty', desc: 'Earn points and move through our tiered program' }
    ];

    // INJECT LOOKBOOK EDITORIAL LAYOUT (Dynamic)
    appContent.innerHTML = '';

    // Legacy Data Migration (same logic as in admin, but for front-end rendering fallback)
    function migrateLegacyLookbook(lbObj) {
        if (lbObj && lbObj.version === 2) return lbObj;
        const newLb = { version: 2, title: 'Legacy', zones: [] };
        if (!lbObj || Object.keys(lbObj).length === 0) return newLb;
        const cb = (img, vid, width=100) => ({ id: 'b'+Date.now()+Math.random(), width, type: 'media', img: img||'', vid: vid||'', link: '' }
});
        
        if (lbObj.splitLeft || lbObj.splitRight) { newLb.zones.push({ id: 'z1', blocks: [cb(lbObj.splitLeft, lbObj.splitLeftVideo, 50), cb(lbObj.splitRight, lbObj.splitRightVideo, 50)] }
}); }
        if (lbObj.fullWidth) { newLb.zones.push({ id: 'z2', blocks: [cb(lbObj.fullWidth, lbObj.fullWidthVideo, 100)] }
}); }
        if (lbObj.splitLeft2 || lbObj.splitRight2) { newLb.zones.push({ id: 'z3', blocks: [cb(lbObj.splitLeft2, lbObj.splitLeft2Video, 50), cb(lbObj.splitRight2, lbObj.splitRight2Video, 50)] }
}); }
        if (lbObj.asymLeft || lbObj.asymRight1) {
            newLb.zones.push({
                id: 'z4',
                blocks: [
                    cb(lbObj.asymLeft, lbObj.asymLeftVideo, 50),
                    { id: 'b_nest', width: 50, type: 'nested', grid: 4, children: [
                        cb(lbObj.asymRight1, lbObj.asymRight1Video), cb(lbObj.asymRight2, lbObj.asymRight2Video),
                        cb(lbObj.asymRight3, lbObj.asymRight3Video), cb(lbObj.asymRight4, lbObj.asymRight4Video)
                    ]}
                ]
            }
});
        }
        return newLb;
    }

    const dynamicLayout = migrateLegacyLookbook(settings.lookbook || {}
});

    // Create a container wrapper
    const lookbookWrapper = document.createElement('div');
    lookbookWrapper.className = 'dynamic-lookbook';
    appContent.appendChild(lookbookWrapper);

    // Dynamic rendering function
    function renderDynamicBlock(block, isChild = false) {
        const el = document.createElement('div');
        if (!isChild) {
            el.className = 'lb-dynamic-item';
            el.style.width = block.width + '%';
        } else {
            el.className = 'lb-dynamic-child-item';
        }
        el.style.position = 'relative';
        el.style.overflow = 'hidden';
        
        // CSS for flex children in nested grids
        if (isChild) {
            el.style.display = 'flex';
        }

        if (block.type === 'media') {
            const targetLink = block.link || 'products.html';
            el.style.cursor = 'pointer';
            el.onclick = () => window.location.href = targetLink;

            let imgAdded = false, vidAdded = false;
            let mediaElVid, mediaElImg;

            if (block.vid) {
                mediaElVid = document.createElement('video');
                mediaElVid.autoplay = false; mediaElVid.loop = true; mediaElVid.muted = true; mediaElVid.playsInline = true;
                mediaElVid.setAttribute('muted', 'muted'); mediaElVid.setAttribute('playsinline', ''); mediaElVid.setAttribute('loop', '');
                mediaElVid.className = 'lookbook-vid lookbook-media';
                mediaElVid.style.position = 'absolute'; mediaElVid.style.top = '0'; mediaElVid.style.left = '0';
                mediaElVid.style.width = '100%'; mediaElVid.style.height = '100%'; mediaElVid.style.objectFit = 'cover';
                mediaElVid.style.opacity = '0'; mediaElVid.style.transition = 'none';
                
                try {
                    fetch(block.vid).then(res => res.blob()).then(blob => {
                        mediaElVid.src = URL.createObjectURL(blob); mediaElVid.load();
                    }).catch(() => mediaElVid.src = block.vid);
                } catch(e) { mediaElVid.src = block.vid; }
                
                el.appendChild(mediaElVid);
                vidAdded = true;
            }

            if (block.img) {
                mediaElImg = document.createElement('img');
                mediaElImg.className = 'lookbook-img lookbook-media';
                mediaElImg.style.width = '100%'; mediaElImg.style.height = '100%'; mediaElImg.style.objectFit = 'cover';
                
                if (block.img.startsWith('data:') && block.img.length > 1000) {
                    fetch(block.img).then(res => res.blob()).then(blob => {
                        mediaElImg.src = URL.createObjectURL(blob);
                    }).catch(() => mediaElImg.src = block.img);
                } else { mediaElImg.src = block.img; }
                
                el.appendChild(mediaElImg);
                imgAdded = true;
            }

            if (imgAdded && vidAdded) {
                el.addEventListener('mouseenter', () => { mediaElVid.play().catch(()=>{}
}); mediaElVid.style.opacity='1'; mediaElImg.style.opacity='0'; }
});
                el.addEventListener('mouseleave', () => { mediaElVid.pause(); mediaElVid.style.opacity='0'; mediaElImg.style.opacity='1'; }
});
            } else if (vidAdded && !imgAdded) {
                mediaElVid.style.opacity = '1'; mediaElVid.autoplay = true; mediaElVid.play().catch(()=>{}
});
            } else if (!imgAdded && !vidAdded) {
                el.style.backgroundColor = '#f4f4f4';
            }
        } else if (block.type === 'nested') {
            el.className += ' lb-nested-grid';
            el.style.display = 'grid';
            el.style.gap = '2px';
            if (block.grid === 2) el.style.gridTemplateColumns = '1fr 1fr';
            else if (block.grid === 3) el.style.gridTemplateColumns = '1fr 1fr 1fr';
            else if (block.grid === 4) {
                el.style.gridTemplateColumns = '1fr 1fr';
                el.style.gridTemplateRows = '1fr 1fr';
            }

            block.children.forEach(child => {
                const childEl = renderDynamicBlock(child, true);
                el.appendChild(childEl);
            }
});
        }
        return el;
    }

    dynamicLayout.zones.forEach(zone => {
        const zoneRow = document.createElement('section');
        zoneRow.className = 'lb-dynamic-zone';
        zoneRow.style.display = 'flex';
        // Add responsiveness constraint via class
        zone.blocks.forEach(block => {
            const blockEl = renderDynamicBlock(block, false);
            zoneRow.appendChild(blockEl);
        }
});
        lookbookWrapper.appendChild(zoneRow);
    }
});

    } catch (globalErr) {
        console.error("Initialization error:", globalErr);
    }
}
});
