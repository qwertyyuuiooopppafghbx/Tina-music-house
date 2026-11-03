// ============================================
// 可视化效果（无翻译功能）
// ============================================

import { getFrequencyData } from './audioManager.js';
import { createParticleSplash, createNote } from './particleSystem.js';

let canvas, ctx;
let wavePoints = [];
let heartVibration = 0;
let globalWaveOffset = 0;
const WAVE_COUNT = 60;

// 初始化画布
export function initVisualizer(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    initWavePoints();
}

// 调整画布大小
export function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initWavePoints();
}

// 初始化波浪点
function initWavePoints() {
    wavePoints = [];
    const step = canvas.width / (WAVE_COUNT - 1);
    const baseY = canvas.height * 0.5 + 80;
    for (let i = 0; i < WAVE_COUNT; i++) {
        wavePoints.push({
            x: i * step,
            y: baseY,
            baseY: baseY,
            targetY: baseY,
            speed: 0.18,
            damping: 0.93
        });
    }
}

// 更新波浪
function updateWave() {
    const dataArray = getFrequencyData();
    if (!dataArray) return;
    
    globalWaveOffset += 0.22;
    const step = Math.floor(dataArray.length / WAVE_COUNT);
    for (let i = 0; i < WAVE_COUNT; i++) {
        const v = dataArray[i * step % dataArray.length] / 255;
        const amp = v * 110;
        const w = Math.sin(globalWaveOffset + i * 0.16) * 9;
        wavePoints[i].targetY = wavePoints[i].baseY - amp - w;
        const dy = wavePoints[i].targetY - wavePoints[i].y;
        wavePoints[i].y += dy * wavePoints[i].speed;
    }
}

// 绘制柱状可视化
function drawBarVisualizer(style) {
    const dataArray = getFrequencyData();
    if (!dataArray) return;
    
    const w = style.size;
    const sp = 8;
    const cnt = Math.floor(canvas.width / sp);
    const r = w / 2;
    
    for (let i = 0; i < cnt; i++) {
        const v = dataArray[i % dataArray.length] / 255;
        const h = v * canvas.height * 0.4125;
        const x = i * sp + (sp - w) / 2;
        const top = canvas.height - h;
        
        const grad = ctx.createLinearGradient(0, top, 0, canvas.height);
        grad.addColorStop(0, style.color1);
        grad.addColorStop(0.3, style.color1 + 'CC');
        grad.addColorStop(1, style.color2);
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.moveTo(x, top + r);
        ctx.arcTo(x, top, x + w, top, r);
        ctx.arcTo(x + w, top, x + w, top + r, r);
        ctx.lineTo(x + w, canvas.height);
        ctx.lineTo(x, canvas.height);
        ctx.fill();
    }
}

// 绘制心形可视化
function drawHeartVisualizer(style) {
    const dataArray = getFrequencyData();
    if (!dataArray) return;
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    let sum = 0;
    dataArray.forEach(v => sum += v);
    const avg = sum / dataArray.length / 255;
    const scale = style.size / 5;
    const baseSize = 8 * scale;
    heartVibration = avg * 2.0;
    
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 2; t += 0.02) {
        let x = 16 * Math.sin(t) ** 3;
        let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const vib = Math.sin(t * 4 + Date.now() * 0.006) * heartVibration;
        x += vib;
        y += vib;
        if (t === 0) ctx.moveTo(cx + x * baseSize, cy - y * baseSize);
        else ctx.lineTo(cx + x * baseSize, cy - y * baseSize);
    }
    ctx.closePath();
    
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseSize * 16);
    rg.addColorStop(0, style.color1);
    rg.addColorStop(1, style.color2);
    ctx.fillStyle = rg;
    ctx.fill();
    
    // 随机产生粒子
    if (avg > 0.22 && Math.random() < 0.28) {
        const a = Math.random() * Math.PI * 2;
        const t = a;
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        createParticleSplash(ctx, cx + x * baseSize, cy - y * baseSize, style);
    }
}

// 绘制五线谱
function drawStaffLines(style) {
    const centerY = wavePoints[0].baseY;
    const spacing = 14;
    ctx.save();
    for (let i = -2; i <= 2; i++) {
        const alpha = 0.3 + Math.abs(i) * 0.15;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, style.color1);
        grad.addColorStop(1, style.color2);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let j = 0; j < wavePoints.length; j++) {
            const wave = wavePoints[j].y - wavePoints[j].baseY;
            const y = centerY + i * spacing + wave;
            if (j === 0) ctx.moveTo(wavePoints[j].x, y);
            else ctx.lineTo(wavePoints[j].x, y);
        }
        ctx.stroke();
    }
    ctx.restore();
}

// 绘制波浪可视化
function drawWaveVisualizer(style) {
    if (wavePoints.length === 0) initWavePoints();
    updateWave();
    drawStaffLines(style);
    
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, style.color1);
    grad.addColorStop(1, style.color2);
    
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = style.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
    for (let i = 1; i < wavePoints.length - 2; i++) {
        const xc = (wavePoints[i].x + wavePoints[i + 1].x) / 2;
        const yc = (wavePoints[i].y + wavePoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(wavePoints[i].x, wavePoints[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(
        wavePoints[wavePoints.length - 2].x,
        wavePoints[wavePoints.length - 2].y,
        wavePoints[wavePoints.length - 1].x,
        wavePoints[wavePoints.length - 1].y
    );
    ctx.stroke();
    ctx.restore();
}

// 主绘制函数
export function drawFrame(context, style) {
    ctx = context || ctx;
    if (!ctx) return;
    
    switch(style.type) {
        case 'line':
            drawBarVisualizer(style);
            break;
        case 'heart':
            drawHeartVisualizer(style);
            break;
        case 'wave':
            drawWaveVisualizer(style);
            break;
        default:
            drawBarVisualizer(style);
    }
}