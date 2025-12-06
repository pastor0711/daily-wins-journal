window.DailyWins = window.DailyWins || {};

window.DailyWins.Effects = {
    particleAnimation: null,

    initParticles(enabled = true) {
        const container = document.getElementById('particles');
        if (!container) return;

        container.innerHTML = '';

        if (!enabled) return;

        const particleCount = window.innerWidth < 768 ? 25 : 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 4 + 2;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 8;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: var(--particle-color);
                left: ${x}%;
                top: ${y}%;
                opacity: 0;
                animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
            `;

            container.appendChild(particle);
        }

        if (!document.getElementById('particleStyles')) {
            const style = document.createElement('style');
            style.id = 'particleStyles';
            style.textContent = `
                @keyframes particleFloat {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                        opacity: 0.3;
                    }
                    25% {
                        transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(1.2);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(0.8);
                        opacity: 0.4;
                    }
                    75% {
                        transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(1.1);
                        opacity: 0.5;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },

    celebrate() {
        const canvas = document.getElementById('celebration');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 60;
        const colors = [
            'rgba(255, 182, 193, 1)',
            'rgba(255, 229, 180, 1)',
            'rgba(183, 148, 246, 1)',
            'rgba(168, 230, 207, 1)',
            'rgba(126, 200, 227, 1)',
            'rgba(255, 215, 0, 0.8)'
        ];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 6,
                radius: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let alive = false;

            particles.forEach(p => {
                if (p.life > 0) {
                    alive = true;

                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.25;
                    p.life -= 0.012;
                    p.rotation += p.rotationSpeed;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;

                    if (Math.random() > 0.5) {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius);
                    }

                    ctx.restore();
                }
            });

            ctx.globalAlpha = 1;

            if (alive) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    },

    addShimmer(element) {
        element.classList.add('shimmer');
        setTimeout(() => element.classList.remove('shimmer'), 1000);
    },

    createRipple(event, element) {
        const circle = document.createElement('span');
        const diameter = Math.max(element.clientWidth, element.clientHeight);
        const radius = diameter / 2;

        circle.style.cssText = `
            width: ${diameter}px;
            height: ${diameter}px;
            left: ${event.clientX - element.offsetLeft - radius}px;
            top: ${event.clientY - element.offsetTop - radius}px;
        `;
        circle.classList.add('ripple');

        const ripple = element.querySelector('.ripple');
        if (ripple) ripple.remove();

        element.appendChild(circle);

        setTimeout(() => circle.remove(), 600);
    }
};
