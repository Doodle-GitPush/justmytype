import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';

// Font files can't be read for their raw glyph outlines from here (Google
// serves WOFF2 to real browsers, and there's no client-side way to force a
// different format or decode it into geometry without a much heavier
// pipeline) — so instead of building solid 3D letterforms, this rasterizes
// the text with the browser's own font renderer (works for any of the
// ~1900 fonts here, or an uploaded one, identically) and turns that raster
// into a height field: bright pixels stand tall, dark ones stay flat. A
// blurred alpha edge on the way in gives that height field a sloped rather
// than cliff-like edge, which is what reads as a bevel once it's lit.
const VERTEX_SHADER = `
  uniform sampler2D uTexture;
  uniform float uExtrude;
  uniform float uTexel;
  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    float h = texture2D(uTexture, uv).r;
    vHeight = h;

    float hL = texture2D(uTexture, uv - vec2(uTexel, 0.0)).r;
    float hR = texture2D(uTexture, uv + vec2(uTexel, 0.0)).r;
    float hD = texture2D(uTexture, uv - vec2(0.0, uTexel)).r;
    float hU = texture2D(uTexture, uv + vec2(0.0, uTexel)).r;
    float strength = 14.0 * uExtrude;
    vec3 tangentX = vec3(1.0, 0.0, (hR - hL) * strength);
    vec3 tangentY = vec3(0.0, 1.0, (hU - hD) * strength);
    vNormal = normalize(cross(tangentX, tangentY));

    vec3 pos = position;
    pos.z += h * uExtrude * 0.55;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform vec3 uLightDir;
  uniform float uIsDark;
  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    if (vHeight < 0.04) discard;

    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    vec3 V = vec3(0.0, 0.0, 1.0);
    float diff = max(dot(N, L), 0.0);
    vec3 halfDir = normalize(L + V);
    float spec = pow(max(dot(N, halfDir), 0.0), 40.0);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    vec3 skyTop = mix(vec3(0.88, 0.90, 0.97), vec3(0.20, 0.21, 0.28), uIsDark);
    vec3 skyBottom = mix(vec3(0.55, 0.56, 0.62), vec3(0.02, 0.02, 0.03), uIsDark);
    vec3 reflection = mix(skyBottom, skyTop, N.y * 0.5 + 0.5);

    vec3 base = uColor * (0.4 + diff * 0.7);
    vec3 color = base + spec * 0.55 + reflection * fresnel * 0.6;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const ACCENT = new THREE.Color('#FF4400');

// A whole sentence set on one line would produce an extremely wide, thin
// canvas — every glyph would render at a sliver of the frame once the
// camera pulled back to fit it. Wrapping keeps the aspect ratio (and so
// the apparent size of each letter's relief) reasonable regardless of
// whether the headline is one word or a full pasted sentence.
function wrapLines(ctx, text, maxLineWidth) {
  const words = (text || ' ').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(trial).width > maxLineWidth) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  lines.push(current || ' ');
  return lines;
}

function rasterizeText(text, fontFamily, fontWeight) {
  const measure = document.createElement('canvas').getContext('2d');
  const basePx = 200;
  measure.font = `${fontWeight} ${basePx}px ${fontFamily}`;

  const lines = wrapLines(measure, text, basePx * 9);
  const ascent = basePx * 0.78;
  const descent = basePx * 0.22;
  const lineHeight = basePx * 1.12;
  const padding = basePx * 0.3;

  let maxLineWidth = 0;
  for (const line of lines) maxLineWidth = Math.max(maxLineWidth, measure.measureText(line).width);

  const w = Math.max(1, Math.ceil(maxLineWidth + padding * 2));
  const h = Math.max(1, Math.ceil((lines.length - 1) * lineHeight + ascent + descent + padding * 2));

  const scale = 3;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.filter = 'blur(3px)';
  ctx.fillStyle = '#fff';
  ctx.font = `${fontWeight} ${basePx}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    const lineWidth = ctx.measureText(line).width;
    ctx.fillText(line, (w - lineWidth) / 2, padding + ascent + i * lineHeight);
  });

  return { canvas, aspect: w / h, texelX: 1 / canvas.width, texelY: 1 / canvas.height };
}

/**
 * A WebGL relief of the current headline: extruded from a rasterized-text
 * height field, lit, faintly reflective, drifting particles behind it,
 * gentle autonomous camera motion. Rebuilds its geometry whenever text,
 * font, or weight changes; disposes every GPU resource on unmount so
 * toggling the Animation pill on and off repeatedly doesn't leak.
 */
export default function WebglTextScene({ text, fontFamily, fontWeight, isDark }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const [glFailed, setGlFailed] = useState(false);

  // One-time scene/renderer/particles setup.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // Browser WebGL disabled, GPU blocklisted, extension blocking it,
      // etc. — say so instead of leaving the toggle looking like it did
      // nothing at all. Deferred a tick: setting state synchronously inside
      // an effect body triggers a cascading render React warns about.
      queueMicrotask(() => setGlFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const group = new THREE.Group();
    scene.add(group);

    // Ambient dust drifting behind the text — the "particles" layer.
    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = -Math.random() * 6 - 1;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xff4400,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    container.addEventListener('pointermove', onPointerMove);

    const reduced = prefersReducedMotion();
    const startTime = performance.now();
    let raf;
    const tick = () => {
      const t = (performance.now() - startTime) / 1000;
      if (!reduced) {
        group.rotation.y = Math.sin(t * 0.35) * 0.18;
        group.rotation.x = Math.sin(t * 0.25) * 0.06;
        camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
        camera.position.y += (-pointer.y * 0.5 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        particles.rotation.y = t * 0.015;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    stateRef.current = { renderer, scene, camera, group, particles, ro, onPointerMove, mesh: null };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      stateRef.current?.mesh?.geometry.dispose();
      stateRef.current?.mesh?.material.dispose();
      stateRef.current?.mesh?.material.uniforms.uTexture.value?.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      stateRef.current = null;
    };
    // Scene/renderer are built once; text/font updates are handled by the
    // effect below via the same stateRef instead of a full teardown.
  }, []);

  // Rebuild just the text mesh when what it should say/look like changes.
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    const { scene, group } = st;

    const { canvas, aspect, texelX, texelY } = rasterizeText(text, fontFamily, fontWeight);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const width = 5.6;
    const height = width / aspect;
    const segX = Math.min(400, Math.round(width * 40));
    const segY = Math.min(240, Math.round(height * 40));
    const geometry = new THREE.PlaneGeometry(width, height, segX, segY);

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTexture: { value: texture },
        uExtrude: { value: 0 },
        uTexel: { value: (texelX + texelY) / 2 },
        uColor: { value: ACCENT },
        uLightDir: { value: new THREE.Vector3(0.4, 0.6, 1) },
        uIsDark: { value: isDark ? 1 : 0 },
      },
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Frame whatever text this is — a single word and a full sentence need
    // very different camera distances, or one of them ends up either
    // microscopic or spilling past the edges of the canvas.
    const cam = st.camera;
    if (cam) {
      const fovRad = (cam.fov * Math.PI) / 180;
      const padding = 1.35; // headroom for the group's own idle rotation
      const distForHeight = height * padding / (2 * Math.tan(fovRad / 2));
      const distForWidth = width * padding / (2 * Math.tan(fovRad / 2) * cam.aspect);
      const targetZ = Math.max(distForHeight, distForWidth, 3);
      if (prefersReducedMotion()) {
        cam.position.z = targetZ;
      } else {
        gsap.to(cam.position, { z: targetZ, duration: DUR.slow, ease: EASE.out });
      }
    }

    if (st.mesh) {
      group.remove(st.mesh);
      st.mesh.geometry.dispose();
      st.mesh.material.uniforms.uTexture.value?.dispose();
      st.mesh.material.dispose();
    }
    group.add(mesh);
    st.mesh = mesh;
    scene.userData.aspect = aspect;

    const reduced = prefersReducedMotion();
    if (reduced) {
      material.uniforms.uExtrude.value = 1;
    } else {
      gsap.fromTo(
        material.uniforms.uExtrude,
        { value: 0 },
        { value: 1, duration: DUR.slow * 1.4, ease: EASE.type }
      );
      gsap.fromTo(mesh.scale, { x: 0.92, y: 0.92, z: 0.92 }, { x: 1, y: 1, z: 1, duration: DUR.slow, ease: EASE.out });
    }

    return () => {
      // Only torn down here if this effect re-fires before unmount; the
      // outer unmount cleanup above handles the final disposal.
    };
  }, [text, fontFamily, fontWeight, isDark]);

  if (glFailed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center px-6">
        <p className="text-[14px] text-muted-foreground max-w-[360px]">
          This browser can&apos;t create a WebGL context, so the animated
          view isn&apos;t available here — try a different browser or
          device.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
