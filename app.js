const content = document.querySelector('#content');
const noise = document.querySelector('.fx-static');
const navLinks = document.querySelectorAll('nav [data-page]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const images = [
    '1.jpg',
    '2.jpeg',
    '3.jpg',
    '4.jpg'
];

// loading effect
function flashStatic() {
    if (reduceMotion.matches) return;
    noise.classList.remove('on');
    void noise.offsetWidth; // restart the animation
    noise.classList.add('on');
}

// active effect on current page in navigation
function markActive(page) {
    navLinks.forEach(link => {
        if (link.dataset.page === page)
            link.setAttribute('aria-current', 'page');
        else
            link.removeAttribute('aria-current');
    });
}

function getRandomImage() {
    const file = images[Math.floor(Math.random() * images.length)];
    return `media/${file}`;
}

function pageFromURL() {
    const path = location.pathname.replace(/^\/+|\/+$/g, "");
    return (path === "" || path === "index.html") ? "home" : path;
}


// page load
async function loadPage(page, { push = true, flash = true } = {}) {
    if (flash) flashStatic();

    try {
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok)
            throw new Error(`Page not found: ${response.status}`);

        const html = await response.text();
        content.innerHTML = html;
        markActive(page);

        if (push)
            history.pushState({ page }, "", `/${page}`);
    } catch (error) {
        console.error(error);
        markActive(null);
        // Render your 404 state inside the main shell
        content.innerHTML = `
            <div class="error-page">
                <h1>404</h1>
                <p>Oops! The page you're looking for doesn't exist.</p>
                <a href="/home" data-page="home">Return Home</a>
            </div>
        `;
    }

    // start each page at the top of the glass
    content.scrollTop = 0;
    if (flash) content.focus({ preventScroll: true });
    if(pageFromURL() == 'home'){
        const avatar = document.getElementById('avatar');
        avatar.src = getRandomImage(); 
        setInterval( 
                    (function(){
                        avatar.src = getRandomImage();}
                        )
                    , 10000); 
    }
}

// click listener for navigation
// Delegated on document so links inside loaded pages (like the 404
// "Return Home" link) work too, not just the ones in the nav.
document.addEventListener("click", event => {
    // let ctrl/cmd/shift-click and middle-click behave normally
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
        return;

    const link = event.target.closest("[data-page]");
    if (!link) return;

    event.preventDefault();
    if(pageFromURL() != link.dataset.page)
        loadPage(link.dataset.page);
});

// back and forward browser buttons
window.addEventListener("popstate", () => {
    loadPage(pageFromURL(), { push: false });
});

// initial load (no static: the power-on animation covers it)
loadPage(pageFromURL(), { push: false, flash: false });


