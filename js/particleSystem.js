// ============================================
// 粒子特效系统（无翻译功能）
// ============================================

let particles = [];
let rippleParticles = [];
let noteParticles = [];

// 创建溅射粒子
export function createParticleSplash(context, x, y, style) {
    const ctx = context;
    const cnt = 5 + Math.floor(Math.random() * 4);
    const grad = ctx.createLinearGradient(0, 0, 0, 120);
    grad.addColorStop(0, style.color1);
    grad.addColorStop(0.3, style.color1 + 'CC');
    grad.addColorStop(1, style.color2);
    
    for (let i = 0; i < cnt; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            size: 2 + Math.random() * 4,
            color: grad,
            alpha: 1,
            decay: 0.012
        });
    }
}

// 创建涟漪
export function createRipple(x, y) {
    rippleParticles.push({
        x, y,
        r: 0,
        alpha: 1,
        maxR: 150,
        speed: 4
    });
}

// 创建音符粒子
export function createNote(x, y) {
    const types = ['♪', '♩'];
    if (Math.random() > 0.005) return;
    noteParticles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 1.5,
        text: types[Math.floor(Math.random() * 2)],
        alpha: 0,
        targetAlpha: 0.9,
        size: 32 + Math.random() * 24,
        life: 1,
        initialSize: 32 + Math.random() * 24
    });
}

// 更新所有粒子
export function updateParticles() {
    // 更新溅射粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.vy += 0.12;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
    
    // 更新涟漪
    for (let i = rippleParticles.length - 1; i >= 0; i--) {
        const r = rippleParticles[i];
        r.r += r.speed;
        r.alpha = 1 - r.r / r.maxR;
        if (r.alpha <= 0) rippleParticles.splice(i, 1);
    }
    
    // 更新音符
    for (let i = noteParticles.length - 1; i >= 0; i--) {
        const n = noteParticles[i];
        n.x += n.vx;
        n.y += n.vy;
        n.life -= 0.01;
        n.size = n.initialSize * n.life;
        if (n.alpha < n.targetAlpha) n.alpha += 0.04;
        if (n.life <= 0) noteParticles.splice(i, 1);
    }
}

// 绘制所有粒子
export function drawParticles(context) {
    const ctx = context;
    
    // 绘制溅射粒子
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
    });
    
    // 绘制涟漪
    rippleParticles.forEach(r => {
        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = '#F9E5AF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
    
    // 绘制音符
    noteParticles.forEach(n => {
        ctx.save();
        ctx.globalAlpha = n.alpha;
        const grad = ctx.createLinearGradient(0, n.y - 10, 0, n.y + 10);
        grad.addColorStop(0, '#F9E5AF');
        grad.addColorStop(0.3, '#F9E5AFCC');
        grad.addColorStop(1, '#86C5CA');
        ctx.fillStyle = grad;
        ctx.font = `${n.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(n.text, n.x, n.y);
        ctx.restore();
    });
}

// 清除所有粒子
export function clearParticles() {
    particles = [];
    rippleParticles = [];
    noteParticles = [];
}

// 获取粒子数量
export function getParticleCount() {
    return particles.length + rippleParticles.length + noteParticles.length;
}