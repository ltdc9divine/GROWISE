(() => {
  const canvases = [...document.querySelectorAll(".gw-scene[data-scene]")];
  if (!canvases.length) return;

  const TAU = Math.PI * 2;
  const lime = "#B9FF4A";
  const lime2 = "#D9FF9B";
  const olive = "#648B2D";

  function rotate(point, rx, ry, rz) {
    let { x, y, z } = point;
    let c = Math.cos(rx), s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ry); s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rz); s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
    return { x, y, z };
  }

  function project(point, width, height, scale = 1) {
    const camera = 680;
    const k = camera / (camera + point.z);
    return {
      x: width / 2 + point.x * k * scale,
      y: height / 2 + point.y * k * scale,
      z: point.z,
      k
    };
  }

  function line(ctx, a, b, color, width = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function dot(ctx, point, radius, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const gradient = ctx.createRadialGradient(
      point.x - radius * .35, point.y - radius * .4, 0,
      point.x, point.y, radius * 1.7
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(.22, lime2);
    gradient.addColorStop(.65, color);
    gradient.addColorStop(1, "rgba(100,139,45,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 1.7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function ring(ctx, width, height, time, config) {
    const points = [];
    const count = config.n || 100;
    for (let i = 0; i <= count; i++) {
      const angle = i / count * TAU;
      const point = rotate({
        x: Math.cos(angle) * config.rx,
        y: Math.sin(angle) * config.ry,
        z: Math.sin(angle * config.wave + time * config.waveSpeed) * config.depth
      }, config.rxRot + time * config.ax,
      config.ryRot + time * config.ay,
      config.rzRot + time * config.az);
      points.push(project(point, width, height, config.scale || 1));
    }
    ctx.save();
    ctx.strokeStyle = config.color || olive;
    ctx.globalAlpha = config.alpha ?? .42;
    ctx.lineWidth = config.width || 1.1;
    ctx.setLineDash(config.dash || []);
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
    return points;
  }

  function spherePoints(count, radius, phase = 0) {
    const points = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - i / (count - 1) * 2;
      const r = Math.sqrt(1 - y * y);
      const angle = golden * i + phase;
      points.push({
        x: Math.cos(angle) * r * radius,
        y: y * radius,
        z: Math.sin(angle) * r * radius
      });
    }
    return points;
  }

  function drawAbout(ctx, width, height, time) {
    const points = spherePoints(112, 158, .35);
    const ax = .58 + Math.sin(time * .67) * .72;
    const ay = .4 + time * .62 + Math.sin(time * .31) * .3;
    const az = .2 + time * .44 + Math.cos(time * .41) * .22;
    const projected = points.map(point => project(rotate(point, ax, ay, az), width, height));

    for (let i = 0; i < points.length; i++) {
      const nearest = [];
      for (let j = 0; j < points.length; j++) {
        if (j === i) continue;
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        nearest.push([dx * dx + dy * dy + dz * dz, j]);
      }
      nearest.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < 3; k++) {
        const j = nearest[k][1];
        if (j > i && projected[i].z + projected[j].z < 115) {
          line(ctx, projected[i], projected[j], k === 0 ? "#648B2D" : "#85B94B", .95, k === 0 ? .42 : .25);
        }
      }
    }
    projected.forEach((point, index) => dot(ctx, point, point.z < 0 ? 1.8 : index % 3 === 0 ? 3 : 2.45, index % 5 === 0 ? lime : olive, point.z < 0 ? .78 : .98));
    const center = project(rotate({ x: 0, y: 0, z: 0 }, ax, ay, az), width, height);
    dot(ctx, center, 18, lime);
    ring(ctx, width, height, time, { rx: 214, ry: 92, depth: 54, wave: 2, rxRot: 1.12, ryRot: .18, rzRot: .05, ax: .42, ay: .62, az: .36, waveSpeed: 1.05, color: olive, alpha: .62, width: 1.5 });
    ring(ctx, width, height, time, { rx: 100, ry: 184, depth: 42, wave: 3, rxRot: .28, ryRot: 1.1, rzRot: .42, ax: -.38, ay: .48, az: .31, waveSpeed: .9, color: "#8CB94F", alpha: .48, width: 1.2 });
    ring(ctx, width, height, time, { rx: 176, ry: 154, depth: 32, wave: 2, rxRot: .72, ryRot: .66, rzRot: -.55, ax: .3, ay: -.42, az: .52, waveSpeed: .82, color: "#A6C97C", alpha: .38, width: 1.05, dash: [3, 6] });
  }

  function drawServices(ctx, width, height, time) {
    const rx = .75 + Math.sin(time * .25) * .25;
    const ry = .55 + Math.cos(time * .19) * .35;
    const rz = time * .18;
    ring(ctx, width, height, time, { rx: 188, ry: 105, depth: 38, wave: 2, rxRot: rx, ryRot: ry, rzRot: rz, ax: .15, ay: .33, az: .21, waveSpeed: .9, color: olive, alpha: .5, width: 1.25 });
    ring(ctx, width, height, time, { rx: 150, ry: 135, depth: 24, wave: 3, rxRot: 1.2, ryRot: .15, rzRot: -.5, ax: -.22, ay: .28, az: .17, waveSpeed: .7, color: "#9AB879", alpha: .38, width: 1.05 });
    const nodes = [];
    for (let i = 0; i < 4; i++) {
      const angle = time * .28 + i * Math.PI / 2;
      const point = rotate({
        x: Math.cos(angle) * 178,
        y: Math.sin(angle) * 92,
        z: Math.sin(angle * 1.3 + time * .35) * 92
      }, rx + Math.sin(time * .2 + i) * .18,
      ry + Math.cos(time * .16 + i) * .2, rz);
      nodes.push(project(point, width, height));
    }
    const center = project(rotate({ x: 0, y: 0, z: 0 }, rx, ry, rz), width, height);
    nodes.forEach((point, index) => {
      line(ctx, center, point, olive, 1.15, .37);
      dot(ctx, point, 8 + index % 2 * 2, index % 2 ? olive : lime, .95);
    });
    dot(ctx, center, 18, lime, .98);
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * TAU - time * .2;
      const point = project(rotate({
        x: Math.cos(angle) * 225,
        y: Math.sin(angle) * 135,
        z: Math.cos(angle * 2 + time) * 35
      }, rx, ry, rz), width, height);
      dot(ctx, point, 1.6, olive, .55);
    }
  }

  function polygon(ctx, points, fill, stroke = "rgba(80,115,40,.42)", alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function cube(ctx, width, height, time, config) {
    const { x, y, z, bw, bh, bd, phase = 0 } = config;
    const pulse = 1 + Math.sin(time * 1.3 + phase) * .035;
    const vertices = [
      [-bw / 2, -bh / 2, -bd / 2], [bw / 2, -bh / 2, -bd / 2],
      [bw / 2, bh / 2, -bd / 2], [-bw / 2, bh / 2, -bd / 2],
      [-bw / 2, -bh / 2, bd / 2], [bw / 2, -bh / 2, bd / 2],
      [bw / 2, bh / 2, bd / 2], [-bw / 2, bh / 2, bd / 2]
    ];
    const projected = vertices.map(vertex => {
      const point = rotate({
        x: vertex[0] * pulse + x,
        y: vertex[1] * pulse + y + Math.sin(time * 1.4 + phase) * 8,
        z: vertex[2] * pulse + z
      }, .52 + Math.sin(time * .22 + phase) * .42,
      -.46 + time * .13 + phase * .1,
      .18 + Math.cos(time * .3 + phase) * .16);
      return project(point, width, height);
    });
    const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const ordered = faces.map(face => ({
      face,
      depth: face.reduce((sum, index) => sum + projected[index].z, 0) / 4
    })).sort((a, b) => b.depth - a.depth);
    ordered.forEach(({ face }, index) => polygon(ctx, face.map(vertex => projected[vertex]), [
      "rgba(185,255,74,.22)", "rgba(217,255,155,.38)", "rgba(100,139,45,.07)",
      "rgba(185,255,74,.2)", "rgba(100,139,45,.10)", "rgba(217,255,155,.15)"
    ][index] || "rgba(185,255,74,.1)"));
    return projected;
  }

  function drawPlanner(ctx, width, height, time) {
    ring(ctx, width, height, time, { rx: 220, ry: 115, depth: 25, wave: 2, rxRot: 1.12, ryRot: .24, rzRot: .1, ax: .1, ay: .32, az: .16, waveSpeed: .8, color: olive, alpha: .43, width: 1.15 });
    const heights = [74, 125, 96, 164, 118];
    const positions = [-178, -88, 0, 88, 178];
    const bars = heights.map((barHeight, index) => cube(ctx, width, height, time, {
      x: positions[index],
      y: 40 - barHeight / 2,
      z: Math.sin(time * .5 + index) * 35,
      bw: 48, bh: barHeight, bd: 44, phase: index * .8
    }));
    bars.forEach((vertices, index) => dot(ctx, vertices[6], 3.3, index === 2 ? lime : olive, .9));
    const center = project(rotate({ x: 0, y: -8, z: 90 }, .5 + Math.sin(time * .2) * .3, -.4 + time * .1, .1), width, height);
    dot(ctx, center, 13, lime, .8);
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * TAU + time * .12;
      const point = project(rotate({
        x: Math.cos(angle) * 240,
        y: Math.sin(angle) * 118,
        z: Math.sin(angle * 2) * 30
      }, .8 + time * .1, .3 + time * .2, -.2), width, height);
      dot(ctx, point, 1.8, olive, .62);
    }
  }

  function drawBook(ctx, width, height, time, centerX, centerY, scale, tilt, phase) {
    const bookWidth = 165 * scale;
    const bookHeight = 112 * scale;
    const depth = 18 * scale;
    const vertices = [
      [-bookWidth / 2, -bookHeight / 2, -depth / 2], [bookWidth / 2, -bookHeight / 2, -depth / 2],
      [bookWidth / 2, bookHeight / 2, -depth / 2], [-bookWidth / 2, bookHeight / 2, -depth / 2],
      [-bookWidth / 2, -bookHeight / 2, depth / 2], [bookWidth / 2, -bookHeight / 2, depth / 2],
      [bookWidth / 2, bookHeight / 2, depth / 2], [-bookWidth / 2, bookHeight / 2, depth / 2]
    ];
    const angle = {
      x: .4 + Math.sin(time * .3 + phase) * .22,
      y: -.5 + Math.sin(time * .22 + phase) * .5,
      z: tilt + Math.cos(time * .24 + phase) * .18
    };
    const projected = vertices.map(vertex => project(rotate({
      x: vertex[0] + centerX,
      y: vertex[1] + centerY + Math.sin(time + phase) * 5,
      z: vertex[2]
    }, angle.x, angle.y, angle.z), width, height));
    polygon(ctx, [projected[0], projected[1], projected[2], projected[3]], "rgba(217,255,155,.3)", "rgba(100,139,45,.55)");
    polygon(ctx, [projected[0], projected[3], projected[7], projected[4]], "rgba(100,139,45,.16)", "rgba(100,139,45,.46)");
    polygon(ctx, [projected[3], projected[2], projected[6], projected[7]], "rgba(185,255,74,.2)", "rgba(100,139,45,.38)");
    polygon(ctx, [projected[4], projected[5], projected[6], projected[7]], "rgba(255,255,255,.72)", "rgba(100,139,45,.32)");
    for (let i = 0; i < 4; i++) {
      const y = -bookHeight * .25 + i * 13 * scale;
      const a = project(rotate({ x: -bookWidth * .3 + centerX, y: y + centerY - 1, z: depth / 2 + 1 }, angle.x, angle.y, angle.z), width, height);
      const b = project(rotate({ x: bookWidth * .28 + centerX, y: y + centerY - 1, z: depth / 2 + 1 }, angle.x, angle.y, angle.z), width, height);
      line(ctx, a, b, "#8DAF5D", 1, .5 - i * .07);
    }
  }

  function drawResources(ctx, width, height, time) {
    ring(ctx, width, height, time, { rx: 210, ry: 110, depth: 24, wave: 2, rxRot: 1.05, ryRot: .2, rzRot: -.25, ax: .16, ay: .3, az: .2, waveSpeed: .65, color: olive, alpha: .35, width: 1.05, dash: [3, 6] });
    drawBook(ctx, width, height, time, -12, 0, 1.03, -.18, 0);
    drawBook(ctx, width, height, time, 75, -78, .63, .32, 1.7);
    drawBook(ctx, width, height, time, -92, 83, .52, -.48, 2.8);
    const center = project(rotate({ x: 0, y: 0, z: 75 }, .5 + Math.sin(time * .2) * .3, -.4 + time * .16, .2), width, height);
    dot(ctx, center, 10, lime, .95);
    for (let i = 0; i < 16; i++) {
      const angle = i / 16 * TAU - time * .15;
      const point = project(rotate({
        x: Math.cos(angle) * 238,
        y: Math.sin(angle) * 138,
        z: Math.cos(2 * angle + time) * 30
      }, .5 + time * .12, .5 - time * .16, .2), width, height);
      dot(ctx, point, 1.8, olive, .62);
    }
  }

  function drawSpeechPanel(ctx, width, height, time, config) {
    const { x, y, z, phase } = config;
    const panelWidth = 118, panelHeight = 74, depth = 18;
    const vertices = [
      [-panelWidth / 2, -panelHeight / 2, -depth / 2], [panelWidth / 2, -panelHeight / 2, -depth / 2],
      [panelWidth / 2, panelHeight / 2, -depth / 2], [-panelWidth / 2, panelHeight / 2, -depth / 2],
      [-panelWidth / 2, -panelHeight / 2, depth / 2], [panelWidth / 2, -panelHeight / 2, depth / 2],
      [panelWidth / 2, panelHeight / 2, depth / 2], [-panelWidth / 2, panelHeight / 2, depth / 2]
    ];
    const angle = {
      x: .58 + Math.sin(time * .72 + phase) * .68,
      y: -.52 + time * .31 + Math.cos(time * .61 + phase) * .62,
      z: .18 + Math.sin(time * .57 + phase) * .48
    };
    const px = x + Math.sin(time * .42 + phase) * 17;
    const py = y + Math.cos(time * .36 + phase) * 14;
    const pz = z + Math.sin(time * .49 + phase) * 38;
    const projected = vertices.map(vertex => project(rotate({
      x: vertex[0] + px,
      y: vertex[1] + py + Math.sin(time * 1.15 + phase) * 9,
      z: vertex[2] + pz
    }, angle.x, angle.y, angle.z), width, height));
    polygon(ctx, [projected[0], projected[1], projected[2], projected[3]], "rgba(255,255,255,.76)", "rgba(100,139,45,.62)");
    polygon(ctx, [projected[3], projected[2], projected[6], projected[7]], "rgba(217,255,155,.3)", "rgba(100,139,45,.48)");
    polygon(ctx, [projected[0], projected[3], projected[7], projected[4]], "rgba(185,255,74,.2)", "rgba(100,139,45,.4)");
    const a = project(rotate({ x: px - panelWidth * .25, y: py - 9, z: pz + depth }, angle.x, angle.y, angle.z), width, height);
    const b = project(rotate({ x: px + panelWidth * .25, y: py - 9, z: pz + depth }, angle.x, angle.y, angle.z), width, height);
    line(ctx, a, b, olive, 2.2, .82);
    const c = project(rotate({ x: px - panelWidth * .25, y: py + 10, z: pz + depth }, angle.x, angle.y, angle.z), width, height);
    const d = project(rotate({ x: px + panelWidth * .12, y: py + 10, z: pz + depth }, angle.x, angle.y, angle.z), width, height);
    line(ctx, c, d, lime, 3.2);
  }

  function drawConsultation(ctx, width, height, time) {
    const rx = .72 + Math.sin(time * .52) * .58;
    const ry = .5 + Math.cos(time * .43) * .62;
    const rz = time * .34;
    ring(ctx, width, height, time, { rx: 210, ry: 104, depth: 48, wave: 2, rxRot: .92, ryRot: .48, rzRot: .12, ax: .38, ay: .52, az: .42, waveSpeed: 1.02, color: olive, alpha: .58, width: 1.35 });
    ring(ctx, width, height, time, { rx: 150, ry: 160, depth: 38, wave: 3, rxRot: .22, ryRot: 1.18, rzRot: -.46, ax: -.38, ay: .46, az: .34, waveSpeed: .86, color: "#9AB879", alpha: .43, width: 1.1, dash: [3, 5] });
    ring(ctx, width, height, time, { rx: 185, ry: 78, depth: 62, wave: 2, rxRot: 1.5, ryRot: .38, rzRot: .65, ax: .45, ay: -.34, az: .5, waveSpeed: .78, color: "#B3CE8F", alpha: .36, width: 1 });
    const center = project(rotate({ x: 0, y: 0, z: 0 }, rx, ry, rz), width, height);
    const panels = [{ x: -150, y: -55, z: 15, phase: .3 }, { x: 138, y: -82, z: -15, phase: 1.8 }, { x: 58, y: 95, z: 55, phase: 2.7 }];
    panels.forEach(config => {
      const point = rotate({
        x: config.x + Math.sin(time * .42 + config.phase) * 17,
        y: config.y + Math.cos(time * .36 + config.phase) * 14,
        z: config.z + Math.sin(time * .49 + config.phase) * 38
      }, rx + Math.sin(time * .4 + config.phase) * .15,
      ry + Math.cos(time * .35 + config.phase) * .16, rz);
      const projected = project(point, width, height);
      line(ctx, center, projected, olive, 1.2, .48);
      drawSpeechPanel(ctx, width, height, time, config);
      dot(ctx, projected, 4.6, lime, .96);
    });
    dot(ctx, center, 18, lime);
    for (let i = 0; i < 16; i++) {
      const angle = i / 16 * TAU + time * .22;
      const point = project(rotate({
        x: Math.cos(angle) * 235,
        y: Math.sin(angle) * 140,
        z: Math.sin(angle * 2 + time) * 52
      }, rx + Math.sin(time * .3) * .18,
      ry + Math.cos(time * .27) * .2, rz), width, height);
      dot(ctx, point, 1.9, olive, .68);
    }
  }

  const renderers = {
    about: drawAbout,
    services: drawServices,
    planner: drawPlanner,
    resources: drawResources,
    consultation: drawConsultation
  };

  class HeroScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.host = canvas.parentElement;
      this.page = canvas.closest(".page");
      this.context = canvas.getContext("2d");
      this.renderer = renderers[canvas.dataset.scene];
      this.width = 0;
      this.height = 0;
      this.elapsed = 0;
      this.lastFrame = 0;
      this.frameId = null;
      this.intersecting = false;
      this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");

      if (!this.context || !this.renderer || !this.host || !this.page) {
        console.error("Unable to initialize the V2 hero canvas scene.", canvas);
        return;
      }

      this.resizeObserver = "ResizeObserver" in window
        ? new ResizeObserver(() => {
          this.resize();
          this.sync();
        })
        : null;
      this.resizeObserver?.observe(this.host);

      this.intersectionObserver = "IntersectionObserver" in window
        ? new IntersectionObserver(entries => {
          this.intersecting = entries.some(entry => entry.isIntersecting);
          this.sync();
        }, { threshold: .01 })
        : null;
      this.intersectionObserver?.observe(this.host);

      this.pageObserver = new MutationObserver(() => this.sync());
      this.pageObserver.observe(this.page, { attributes: true, attributeFilter: ["class"] });
      this.onMotionChange = () => this.sync();
      if (this.motion.addEventListener) this.motion.addEventListener("change", this.onMotionChange);
      else this.motion.addListener(this.onMotionChange);
      this.resize();
      this.sync();
    }

    isVisible() {
      if (!this.context || document.visibilityState !== "visible" || !this.page.classList.contains("active")) return false;
      const rect = this.host.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (this.intersectionObserver ? this.intersecting : this.inViewport(rect));
    }

    inViewport(rect = this.host.getBoundingClientRect()) {
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      if (!this.context || rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      this.width = rect.width;
      this.height = rect.height;
      if (this.canvas.width === width && this.canvas.height === height) return;
      this.canvas.width = width;
      this.canvas.height = height;
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.render(this.motion.matches ? 0 : this.elapsed);
    }

    render(time) {
      const ctx = this.context;
      if (!ctx || !this.width || !this.height) return;
      ctx.clearRect(0, 0, this.width, this.height);
      const glow = ctx.createRadialGradient(
        this.width * .5, this.height * .5, 5,
        this.width * .5, this.height * .5, Math.min(this.width, this.height) * .48
      );
      glow.addColorStop(0, "rgba(185,255,74,.075)");
      glow.addColorStop(.55, "rgba(185,255,74,.025)");
      glow.addColorStop(1, "rgba(185,255,74,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);
      const scale = Math.min(1, this.width / 520);
      ctx.save();
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-this.width / 2, -this.height / 2);
      this.renderer(ctx, this.width, this.height, time);
      ctx.restore();
    }

    sync() {
      if (!this.context) return;
      if (!this.isVisible()) {
        this.stop();
      } else if (this.motion.matches) {
        this.stop();
        this.render(0);
      } else {
        this.start();
      }
    }

    start() {
      if (this.frameId !== null) return;
      this.lastFrame = 0;
      this.frameId = requestAnimationFrame(time => this.frame(time));
    }

    stop() {
      if (this.frameId !== null) cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.lastFrame = 0;
    }

    frame(now) {
      this.frameId = null;
      if (!this.isVisible() || this.motion.matches) return;
      if (this.lastFrame) this.elapsed += Math.min((now - this.lastFrame) / 1000, .05);
      this.lastFrame = now;
      this.render(this.elapsed);
      this.frameId = requestAnimationFrame(time => this.frame(time));
    }
  }

  const scenes = canvases.map(canvas => new HeroScene(canvas));
  const refreshScenes = () => scenes.forEach(scene => {
    scene.resize();
    if (!scene.intersectionObserver) scene.intersecting = scene.inViewport();
    scene.sync();
  });
  document.addEventListener("visibilitychange", refreshScenes);
  window.addEventListener("resize", refreshScenes, { passive: true });
  window.addEventListener("scroll", refreshScenes, { passive: true });

  const updateCallouts = locale => {
    document.querySelectorAll(".gw-callout [data-vi][data-en]").forEach(element => {
      element.textContent = element.dataset[locale] || element.dataset.vi;
    });
  };
  updateCallouts(window.Growise?.i18n?.getLocale?.() || document.documentElement.lang || "vi");
  document.addEventListener("growise:localechange", event => updateCallouts(event.detail.locale));
})();
