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

window.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    revealSections();

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
