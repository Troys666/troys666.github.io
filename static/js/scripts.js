const content_dir = 'contents/';
const config_file = 'config.yml';
const section_names = ['home', 'education', 'research', 'experience', 'publications', 'awards'];

function setElementContent(id, value) {
    const element = document.getElementById(id);

    if (!element) {
        console.log("Unknown id and value: " + id + "," + value.toString());
        return;
    }

    element.innerHTML = value;
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');

    function setTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        if (icon) {
            icon.classList.toggle('bi-sun-fill', isDark);
            icon.classList.toggle('bi-moon-stars-fill', !isDark);
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });
}

function revealSections() {
    const sections = document.querySelectorAll('.section');

    if (!('IntersectionObserver' in window)) {
        sections.forEach(section => section.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    sections.forEach(section => observer.observe(section));
}

function typesetMath() {
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise().catch(error => console.log(error));
        return;
    }

    if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
        MathJax.startup.promise
            .then(() => MathJax.typesetPromise())
            .catch(error => console.log(error));
    }
}

function setupVisitorMap() {
    const canvas = document.getElementById('visitorCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const visitorKey = 'sthkxjtu01';
    const mapImage = new Image();
    let mapReady = false;
    let currentVisitors = [];

    function project(lat, lon) {
        return {
            x: ((lon + 180) / 360) * width,
            y: ((90 - lat) / 180) * height
        };
    }

    function drawBase() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--luka-panel').trim() || '#ffffff';
        ctx.fillRect(0, 0, width, height);

        if (mapReady) {
            ctx.save();
            ctx.globalAlpha = 0.58;
            ctx.filter = 'saturate(0.32) contrast(0.9)';
            ctx.drawImage(mapImage, 0, 0, width, height);
            ctx.restore();
            ctx.fillStyle = 'rgba(250, 249, 247, 0.18)';
            ctx.fillRect(0, 0, width, height);
            return;
        }

        ctx.strokeStyle = 'rgba(194, 113, 79, 0.16)';
        ctx.lineWidth = 1;
        for (let lon = -120; lon <= 120; lon += 60) {
            const start = project(-70, lon);
            const end = project(70, lon);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
        for (let lat = -45; lat <= 45; lat += 45) {
            const start = project(lat, -170);
            const end = project(lat, 170);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    function drawVisitors(visitors) {
        drawBase();
        const seen = new Set();
        visitors.forEach(visitor => {
            if (typeof visitor.lat !== 'number' || typeof visitor.lon !== 'number') return;
            const key = `${visitor.lat.toFixed(1)},${visitor.lon.toFixed(1)}`;
            if (seen.has(key)) return;
            seen.add(key);
            const point = project(visitor.lat, visitor.lon);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(194, 113, 79, 0.88)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(194, 113, 79, 0.22)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    window.WAU_r_m = function (_count, _key, _index, visitors) {
        currentVisitors = Array.isArray(visitors) ? visitors : [];
        drawVisitors(currentVisitors);
    };

    mapImage.crossOrigin = 'anonymous';
    mapImage.onload = function () {
        mapReady = true;
        drawVisitors(currentVisitors);
    };
    mapImage.src = 'https://widgets.amung.us/mapbacks/classic.jpg';

    drawBase();

    const script = document.createElement('script');
    const title = encodeURIComponent(document.title || 'S.Th!nk');
    const href = encodeURIComponent(window.location.href);
    const referrer = encodeURIComponent(document.referrer);
    script.async = true;
    script.src = `https://whos.amung.us/pingjs/?k=${visitorKey}&t=${title}&c=m&x=${href}&y=${referrer}&a=0&d=0&v=27&r=${Math.ceil(Math.random() * 9999)}`;
    document.body.appendChild(script);
}

window.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    revealSections();
    setupVisitorMap();

    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => setElementContent(key, yml[key]));
        })
        .catch(error => console.log(error));

    marked.use({ mangle: false, headerIds: false });

    const markdownRequests = section_names.map(name => {
        return fetch(content_dir + name + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                document.getElementById(name + '-md').innerHTML = html;
            })
            .catch(error => console.log(error));
    });

    Promise.all(markdownRequests).then(typesetMath);
});
