const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const PARTICLE_COUNT = 3500;
const HEART_SIZE = 16;

let width, height;
let particles = [];
let isCelebrated = false;
let time = 0;
let yesScale = 1;

const phrases = [
    "No", "Are you sure?", "Really?", "Think again!",
    "Last chance!", "Don't break my heart", "Pls?", "I have snacks!",
    "Look at the other button ->", "Error 404: No not found"
];
let phraseIndex = 0;

window.onload = () => {
    resize();
    initParticles();
    animate();
};

window.addEventListener('resize', resize);
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

const moveNoButton = () => {
    if (isCelebrated) return;

    yesScale += 0.15;
    yesBtn.style.transform = `scale(${yesScale})`;

    phraseIndex = (phraseIndex + 1) % phrases.length;
    noBtn.innerText = phrases[phraseIndex];

    
    const btnWidth = noBtn.offsetWidth;
    const btnHeight = noBtn.offsetHeight;

    const maxX = window.innerWidth * 0.8;
    const maxY = window.innerHeight * 0.8;
    const randomX = Math.random() * maxX - (maxX / 2);
    const randomY = Math.random() * maxY - (maxY / 2);

  
    noBtn.style.position = 'fixed';
    noBtn.style.left = '50%';
    noBtn.style.top = '50%';
    noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;

    noBtn.style.opacity = Math.max(0.5, 1 - (phraseIndex * 0.1));
};

noBtn.addEventListener('mouseover', moveNoButton);
noBtn.addEventListener('click', moveNoButton);
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent click
    moveNoButton();
});

window.acceptProposal = function () {
    if (isCelebrated) return;
    isCelebrated = true;


    document.getElementById('mainUI').style.transition = 'opacity 1s';
    document.getElementById('mainUI').style.opacity = '0';
    document.getElementById('mainUI').style.pointerEvents = 'none';


    const layer = document.getElementById('successScreen');
    layer.style.opacity = '1';
    layer.querySelector('h2').style.transform = 'scale(1)';


    createHeartRain();

    particles.forEach(p => {
        p.friction = 0.96;
        p.vx = (Math.random() - 0.5) * 15;
        p.vy = (Math.random() - 0.5) * 15;
        p.vz = (Math.random() - 0.5) * 15;
    });
};

function createHeartRain() {
    const container = document.body;
    const heartChars = ['❄️','❤️', '💖', '💕', '💗','🖤','❄️'];

    setInterval(() => {
        const heart = document.createElement('div');
        heart.classList.add('heart-rain');
        heart.innerText = heartChars[Math.floor(Math.random() * heartChars.length)];

        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
        heart.style.animationDuration = (Math.random() * 2 + 3) + 's';

        container.appendChild(heart);

        setTimeout(() => { heart.remove(); }, 5000);
    }, 100);
}

class Particle {
    constructor() {
        this.setHeartPos();
        this.x = this.tx; this.y = this.ty; this.z = this.tz;
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.size = Math.random() * 2;
        this.friction = 0.92;
        this.color = `hsl(${340 + Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`;
    }

    setHeartPos() {
        let t = Math.random() * Math.PI * 2;
        // Distribute points more evenly
        let u = Math.random();
        let scale = Math.pow(u, 1 / 3) * HEART_SIZE;

        let x = 16 * Math.pow(Math.sin(t), 3);
        let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));


        let z = (Math.random() - 0.5) * 10;

        this.tx = x * scale;
        this.ty = y * scale;
        this.tz = z * scale;
    }

    update(beat) {
        if (isCelebrated) {
            // Explosion logic
            this.x += this.vx; this.y += this.vy; this.z += this.vz;
            this.vx *= this.friction; this.vy *= this.friction; this.vz *= this.friction;
            this.size *= 0.99; // Fade out
        } else {

            let pulse = 1 + beat * 0.1;

            let targetX = this.tx * pulse;
            let targetY = this.ty * pulse;
            let targetZ = this.tz * pulse;


            this.x += (targetX - this.x) * 0.1;
            this.y += (targetY - this.y) * 0.1;
            this.z += (targetZ - this.z) * 0.1;


            this.x += (Math.random() - 0.5) * 0.5;
            this.y += (Math.random() - 0.5) * 0.5;
            this.z += (Math.random() - 0.5) * 0.5;
        }
    }

    draw(ctx, rx, ry) {
        let y1 = this.y * Math.cos(rx) - this.z * Math.sin(rx);
        let z1 = this.z * Math.cos(rx) + this.y * Math.sin(rx);

        let x1 = this.x * Math.cos(ry) - z1 * Math.sin(ry);
        let z2 = z1 * Math.cos(ry) + this.x * Math.sin(ry);

        let perspective = 500;
        let scale = perspective / (perspective + z2);

        // Clipping
        if (scale < 0 || z2 < -perspective) return;

        let x2d = width / 2 + x1 * scale;
        let y2d = height / 2 + y1 * scale;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x2d, y2d, this.size * scale, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
}

let rotX = 0, rotY = 0;

let targetRotX = 0;
let targetRotY = 0;
let mouse = { x: 0, y: 0 };

document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX - width / 2) * 0.001;
    mouse.y = (e.clientY - height / 2) * 0.001;
});

function animate() {
    requestAnimationFrame(animate);

    ctx.fillStyle = 'rgba(15, 2, 5, 0.4)'; // Trails
    ctx.fillRect(0, 0, width, height);

    time += 0.02;

    let beat = Math.pow(Math.sin(time * 3), 60) * 0.5 + Math.sin(time * 3 + 0.5) * 0.1;

    targetRotY += 0.003; // Auto rotate
    rotY += (targetRotY + mouse.x - rotY) * 0.05;
    rotX += (mouse.y - rotX) * 0.05;

    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
        p.update(beat);
        p.draw(ctx, rotX, rotY);
    });
    ctx.globalCompositeOperation = 'source-over';
}

document.getElementById('noBtn').addEventListener('mouseover', () => {
    document.getElementById('yesBtn').style.right = "0px";
})