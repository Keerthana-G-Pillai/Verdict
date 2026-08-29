"use client";

import { useEffect, useRef } from "react";

interface WebGLShaderProps {
  className?: string;
  opacity?: number;
}

/**
 * WebGL hero shader — faithful port of the Stitch ANIMATION_3 shader.
 * Renders flowing noise-based cyan highlights on near-black charcoal.
 * Cleans up WebGL context and RAF on unmount.
 * Falls back to a static CSS gradient when prefers-reduced-motion is set
 * or when WebGL is unavailable (e.g. low-power mode, screen-share).
 */
export default function WebGLShader({ className = "", opacity = 0.6 }: WebGLShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reduced-motion / no-WebGL fallback — render a static gradient instead.
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    return (
      <div
        className={className}
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          opacity,
          background: "radial-gradient(ellipse at 60% 40%, rgba(0,240,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(111,251,190,0.05) 0%, transparent 50%), #0a0a0b",
        }}
      />
    );
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sync drawing-buffer to CSS layout size
    let rafId: number;
    let isActive = true;

    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncSize)
        : null;
    resizeObserver?.observe(canvas);
    syncSize();

    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader — exact port from Stitch design
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 centered_uv = (uv - 0.5) * 2.0;
        centered_uv.x *= u_resolution.x / u_resolution.y;

        // Near-black charcoal base — #0A0A0B
        vec3 color = vec3(0.039, 0.039, 0.043);

        // Flowing digital "intelligence" waves
        float t = u_time * 0.1;
        float n = noise(uv * 3.0 + t) * 0.5 + noise(uv * 7.0 - t * 0.5) * 0.25;

        // Electric cyan highlights — #00F0FF
        vec3 cyan = vec3(0.0, 0.941, 1.0);
        float highlight = smoothstep(0.4, 0.5, n) * smoothstep(0.6, 0.5, n);

        // Horizontal data pulses
        float pulses = step(0.98, fract(uv.y * 10.0 - u_time * 0.5)) * 0.1;

        color += cyan * highlight * 0.15;
        color += cyan * pulses * 0.05;

        // Vignette
        float vig = 1.0 - smoothstep(0.5, 1.5, length(centered_uv));
        color *= vig;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    if (!program) return;

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = 1.0 - (e.clientY - rect.top) / rect.height;
        mouse = { x: nx * canvas.width, y: ny * canvas.height };
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    function render(t: number) {
      if (!isActive) return;
      syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      // Clean up WebGL resources
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", opacity }}
      aria-hidden="true"
    />
  );
}
