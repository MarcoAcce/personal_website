const content   = document.querySelector('#content');
const noise     = document.querySelector('.fx-static');
const navLinks  = document.querySelectorAll('nav [data-page]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const HOME_IMAGES = ['1.jpg', '2.jpeg', '3.jpg', '4.jpg'];
const AVATAR_INTERVAL = 10000;   // ms between home-page picture swaps

// Home-page picture rotation. Kept at module scope so it can be cancelled
// whenever we navigate, which stops a new timer stacking on top of the old
// one every time Home is opened.
let avatarTimer = null;
let lastImage = null;

// --------------------------------------------------------
// small helpers
// --------------------------------------------------------

// channel-change static, played on navigation
function flashStatic() {
    if (reduceMotion.matches) return;
    noise.classList.remove('on');
    void noise.offsetWidth;      // reflow, so the animation can restart
    noise.classList.add('on');
}

// light the key for the current page (and clear the others)
function markActive(page) {
    navLinks.forEach(link => {
        if (link.dataset.page === page)
            link.setAttribute('aria-current', 'page');
        else
            link.removeAttribute('aria-current');
    });
}

// a random home image that isn't the one already showing
function nextImage() {
    if (HOME_IMAGES.length < 2) return `media/${HOME_IMAGES[0]}`;
    let file;
    do { file = HOME_IMAGES[Math.floor(Math.random() * HOME_IMAGES.length)]; }
    while (file === lastImage);
    lastImage = file;
    return `media/${file}`;
}

function stopAvatarRotation() {
    if (avatarTimer !== null) {
        clearInterval(avatarTimer);
        avatarTimer = null;
    }
}

// Show a random avatar, then cycle it. Cycling is auto-motion, so it's
// suppressed when the visitor asks for reduced motion; they still get one
// random picture per visit.
function startAvatarRotation() {
    const avatar = document.getElementById('avatar');
    if (!avatar) return;

    avatar.src = nextImage();
    if (reduceMotion.matches) return;
    avatarTimer = setInterval(() => { avatar.src = nextImage(); }, AVATAR_INTERVAL);
}

// which page the current URL points at
function pageFromURL() {
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    return (path === '' || path === 'index.html') ? 'home' : path;
}

// --------------------------------------------------------
// page loading
// --------------------------------------------------------
async function loadPage(page, { push = true, flash = true } = {}) {
    if (flash) flashStatic();
    stopAvatarRotation();        // whatever we're leaving, stop its timer

    try {
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok)
            throw new Error(`Page not found: ${response.status}`);

        content.innerHTML = await response.text();
        markActive(page);

        if (push)
            history.pushState({ page }, '', `/${page}`);
    } catch (error) {
        console.error(error);
        markActive(null);
        content.innerHTML = `
            <div class="error-page">
                <h1>404</h1>
                <p>No signal. That page isn't on this channel.</p>
                <a href="/home" data-page="home">Return home</a>
            </div>
        `;
    }

    // start each page at the top of the glass
    content.scrollTop = 0;
    if (flash) content.focus({ preventScroll: true });

    if (pageFromURL() === 'home')
        startAvatarRotation();
}

// --------------------------------------------------------
// view mode: retro TV  <->  plain static site
// The knob switches to the plain view; the "Retro view" button switches back.
// Both just flip the `minimal` class on <body>; all the layout is in CSS.
// --------------------------------------------------------
const toPlainBtn = document.getElementById('to-plain');
const toTvBtn    = document.getElementById('to-tv');

function setView(mode) {
    const minimal = mode === 'plain';
    document.body.classList.toggle('minimal', minimal);
    if (toPlainBtn) toPlainBtn.setAttribute('aria-pressed', String(minimal));
}

function toggleView() {
    setView(document.body.classList.contains('minimal') ? 'tv' : 'plain');
}

toPlainBtn?.addEventListener('click', toggleView);
toTvBtn?.addEventListener('click', toggleView);

// --------------------------------------------------------
// navigation
// --------------------------------------------------------

// Delegated on document so links inside loaded pages (like the 404
// "Return home" link) work too, not just the ones in the nav.
document.addEventListener('click', event => {
    // let ctrl/cmd/shift-click and middle-click behave normally
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
        return;

    const link = event.target.closest('[data-page]');
    if (!link) return;

    event.preventDefault();
    if (pageFromURL() !== link.dataset.page)
        loadPage(link.dataset.page);
});

// browser back / forward
window.addEventListener('popstate', () => {
    loadPage(pageFromURL(), { push: false });
});

// initial load (no static: the power-on animation covers it)
loadPage(pageFromURL(), { push: false, flash: false });