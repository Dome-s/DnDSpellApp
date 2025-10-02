import { useEffect, useRef, useState } from 'react';
import {
  createProgram,
  createDoubleFBO,
  createFBO,
  createQuad,
  clearFBO,
  checkFloatTextureSupport,
  type ShaderProgram,
  type DoubleFBO,
  type FramebufferObject,
} from './webgl-utils.ts';
import * as shaders from './shaders.ts';

export interface FluidSimulationProps {
  width?: number;
  height?: number;
  dissipation?: number;
  velDissipation?: number;
  velocityScale?: number;
  splatRadius?: number;
  splatSpeed?: number;
  splatColor?: [number, number, number, number];
  buoyancy?: number;
  jacobiIterations?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FluidSimulation({
  width = 1024,
  height = 720,
  dissipation = 0.01,
  velDissipation = 0.1,
  velocityScale = 200,
  splatRadius = 0.3,
  splatSpeed = 20,
  splatColor: initialSplatColor = [1, 0.4, 0.1, 1],
  buoyancy = -4,
  jacobiIterations = 120,
  className,
  style,
}: FluidSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splatColor, setSplatColor] = useState(initialSplatColor);

  // Shader programs
  const programsRef = useRef<{
    splat: ShaderProgram | null;
    advectDye: ShaderProgram | null;
    advectVelocity: ShaderProgram | null;
    divergence: ShaderProgram | null;
    jacobi: ShaderProgram | null;
    projection: ShaderProgram | null;
    buoyancy: ShaderProgram | null;
    boundary: ShaderProgram | null;
    display: ShaderProgram | null;
  }>({
    splat: null,
    advectDye: null,
    advectVelocity: null,
    divergence: null,
    jacobi: null,
    projection: null,
    buoyancy: null,
    boundary: null,
    display: null,
  });

  // Framebuffers
  const fbosRef = useRef<{
    dye: (DoubleFBO & { swap: () => void }) | null;
    velocity: (DoubleFBO & { swap: () => void }) | null;
    pressure: (DoubleFBO & { swap: () => void }) | null;
    divergence: FramebufferObject | null;
  }>({
    dye: null,
    velocity: null,
    pressure: null,
    divergence: null,
  });

  const quadRef = useRef<WebGLBuffer | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, down: false });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setError('WebGL2 not supported');
      return;
    }

    glRef.current = gl;

    // Check float texture support and get best format
    const texFormat = checkFloatTextureSupport(gl);
    if (!texFormat.supported) {
      setError('Floating-point textures not supported. Please use a modern browser (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)');
      return;
    }

    // Create shader programs
    const programs = {
      splat: createProgram(gl, shaders.baseVertexShader, shaders.splatShader),
      advectDye: createProgram(gl, shaders.baseVertexShader, shaders.advectDyeShader),
      advectVelocity: createProgram(gl, shaders.baseVertexShader, shaders.advectVelocityShader),
      divergence: createProgram(gl, shaders.baseVertexShader, shaders.divergenceShader),
      jacobi: createProgram(gl, shaders.baseVertexShader, shaders.jacobiShader),
      projection: createProgram(gl, shaders.baseVertexShader, shaders.projectionShader),
      buoyancy: createProgram(gl, shaders.baseVertexShader, shaders.buoyancyShader),
      boundary: createProgram(gl, shaders.baseVertexShader, shaders.boundaryShader),
      display: createProgram(gl, shaders.baseVertexShader, shaders.displayShader),
    };

    if (Object.values(programs).some(p => !p)) {
      setError('Failed to create shader programs');
      return;
    }

    programsRef.current = programs as typeof programsRef.current;

    // Determine internal formats for different texture types based on detected support
    const dyeInternalFormat = texFormat.internalFormat;
    const dyeFormat = texFormat.format;
    const dyeType = texFormat.type;

    // For velocity, try RG format first, fallback to RGBA
    let velInternalFormat: number, velFormat: number;
    if (dyeInternalFormat === gl.RGBA16F || dyeInternalFormat === gl.RGBA32F) {
      velInternalFormat = dyeInternalFormat === gl.RGBA16F ? gl.RG16F : gl.RG32F;
      velFormat = gl.RG;
    } else {
      velInternalFormat = dyeInternalFormat;
      velFormat = dyeFormat;
    }

    // For pressure and divergence, try RED format first, fallback to RGBA
    let pressureInternalFormat: number, pressureFormat: number;
    if (dyeInternalFormat === gl.RGBA16F || dyeInternalFormat === gl.RGBA32F) {
      pressureInternalFormat = dyeInternalFormat === gl.RGBA16F ? gl.R16F : gl.R32F;
      pressureFormat = gl.RED;
    } else {
      pressureInternalFormat = dyeInternalFormat;
      pressureFormat = dyeFormat;
    }

    // Create FBOs with detected formats
    const dyeFBO = createDoubleFBO(gl, width, height, dyeInternalFormat, dyeFormat, dyeType);
    const velocityFBO = createDoubleFBO(gl, width, height, velInternalFormat, velFormat, dyeType);
    const pressureFBO = createDoubleFBO(gl, width, height, pressureInternalFormat, pressureFormat, dyeType);
    const divergenceFBO = createFBO(gl, width, height, pressureInternalFormat, pressureFormat, dyeType);

    if (!dyeFBO || !velocityFBO || !pressureFBO || !divergenceFBO) {
      setError('Failed to create framebuffers');
      return;
    }

    fbosRef.current = {
      dye: dyeFBO as DoubleFBO & { swap: () => void },
      velocity: velocityFBO as DoubleFBO & { swap: () => void },
      pressure: pressureFBO as DoubleFBO & { swap: () => void },
      divergence: divergenceFBO,
    };

    // Clear all FBOs
    clearFBO(gl, dyeFBO.read);
    clearFBO(gl, dyeFBO.write);
    clearFBO(gl, velocityFBO.read);
    clearFBO(gl, velocityFBO.write);
    clearFBO(gl, pressureFBO.read);
    clearFBO(gl, pressureFBO.write);

    // Create quad
    const quad = createQuad(gl);
    if (!quad) {
      setError('Failed to create quad');
      return;
    }
    quadRef.current = quad;

    setInitialized(true);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  // Mouse/touch handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateMousePosition = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = (clientX - rect.left) / rect.width;
      mouseRef.current.y = 1.0 - (clientY - rect.top) / rect.height;
    };

    const onMouseDown = (e: MouseEvent | TouchEvent) => {
      mouseRef.current.down = true;
      updateMousePosition(e);
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      updateMousePosition(e);
    };

    const onMouseUp = () => {
      mouseRef.current.down = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onMouseDown);
    canvas.addEventListener('touchmove', onMouseMove);
    canvas.addEventListener('touchend', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onMouseDown);
      canvas.removeEventListener('touchmove', onMouseMove);
      canvas.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!initialized) return;

    const gl = glRef.current;
    const programs = programsRef.current;
    const fbos = fbosRef.current;
    const quad = quadRef.current;

    if (!gl || !quad || !fbos.dye || !fbos.velocity || !fbos.pressure || !fbos.divergence) return;

    const simulate = (time: number) => {
      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.016) : 0.016;
      lastTimeRef.current = time;

      const texelSize = [1 / width, 1 / height];

      // Splat on mouse input
      if (mouseRef.current.down && programs.splat) {
        const dx = mouseRef.current.x - mouseRef.current.prevX;
        const dy = mouseRef.current.y - mouseRef.current.prevY;

        // Splat dye - write to WRITE buffer, read from READ buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.dye.write.framebuffer);
        gl.useProgram(programs.splat.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.dye.read.texture);
        gl.uniform1i(programs.splat.uniforms['u_dyeTexture'], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.splat.uniforms['u_velocityTexture'], 1);
        gl.uniform2f(programs.splat.uniforms['u_splatPos'], mouseRef.current.x, mouseRef.current.y);
        gl.uniform1f(programs.splat.uniforms['u_splatRadius'], splatRadius);
        gl.uniform4f(programs.splat.uniforms['u_splatColor'], ...splatColor);
        gl.uniform2f(programs.splat.uniforms['u_splatForce'], 0, 0);
        gl.uniform1i(programs.splat.uniforms['u_texType'], 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.splat.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        fbos.dye.swap();

        // Splat velocity - write to WRITE buffer, read from READ buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.write.framebuffer);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.splat.uniforms['u_velocityTexture'], 1);
        // Apply force - velocity in pixels per second
        const fx = dx * splatSpeed * width;
        const fy = dy * splatSpeed * height;
        gl.uniform2f(programs.splat.uniforms['u_splatForce'], fx, fy);
        gl.uniform1i(programs.splat.uniforms['u_texType'], 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        fbos.velocity.swap();
      }

      // 1. Advect dye
      if (programs.advectDye) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.dye.write.framebuffer);
        gl.useProgram(programs.advectDye.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.dye.read.texture);
        gl.uniform1i(programs.advectDye.uniforms['u_dyeTexture'], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.advectDye.uniforms['u_velocityTexture'], 1);
        gl.uniform2f(programs.advectDye.uniforms['u_texelSize'], ...texelSize);
        gl.uniform1f(programs.advectDye.uniforms['u_dt'], dt);
        gl.uniform1f(programs.advectDye.uniforms['u_dissipation'], dissipation);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.advectDye.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        fbos.dye.swap();
      }

      // 2. Advect velocity
      if (programs.advectVelocity) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.write.framebuffer);
        gl.useProgram(programs.advectVelocity.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.advectVelocity.uniforms['u_velocityTexture'], 0);
        gl.uniform2f(programs.advectVelocity.uniforms['u_texelSize'], ...texelSize);
        gl.uniform1f(programs.advectVelocity.uniforms['u_dt'], dt);
        gl.uniform1f(programs.advectVelocity.uniforms['u_velDissipation'], velDissipation);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.advectVelocity.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        fbos.velocity.swap();
      }

      // 3. Apply buoyancy
      if (programs.buoyancy) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.write.framebuffer);
        gl.useProgram(programs.buoyancy.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.buoyancy.uniforms['u_velocityTexture'], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbos.dye.read.texture);
        gl.uniform1i(programs.buoyancy.uniforms['u_dyeTexture'], 1);
        gl.uniform1f(programs.buoyancy.uniforms['u_buoyancy'], buoyancy);
        gl.uniform1f(programs.buoyancy.uniforms['u_ambientDensity'], 0);
        gl.uniform1f(programs.buoyancy.uniforms['u_dt'], dt);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.buoyancy.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        fbos.velocity.swap();
      }

      // 4. Enforce boundaries
      if (programs.boundary) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.write.framebuffer);
        gl.useProgram(programs.boundary.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.boundary.uniforms['u_velocityTexture'], 0);
        gl.uniform2f(programs.boundary.uniforms['u_resolution'], width, height);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.boundary.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        fbos.velocity.swap();
      }

      // 5. Compute divergence
      if (programs.divergence) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.divergence.framebuffer);
        gl.useProgram(programs.divergence.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.divergence.uniforms['u_velocityTexture'], 0);
        gl.uniform2f(programs.divergence.uniforms['u_texelSize'], ...texelSize);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.divergence.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      // 6. Jacobi pressure iterations
      if (programs.jacobi) {
        for (let i = 0; i < jacobiIterations; i++) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.pressure.write.framebuffer);
          gl.useProgram(programs.jacobi.program);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, fbos.pressure.read.texture);
          gl.uniform1i(programs.jacobi.uniforms['u_pressureTexture'], 0);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, fbos.divergence.texture);
          gl.uniform1i(programs.jacobi.uniforms['u_divergenceTexture'], 1);
          gl.uniform2f(programs.jacobi.uniforms['u_texelSize'], ...texelSize);

          gl.bindBuffer(gl.ARRAY_BUFFER, quad);
          const posLoc = programs.jacobi.attributes['a_position'];
          gl.enableVertexAttribArray(posLoc);
          gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          fbos.pressure.swap();
        }
      }

      // 7. Subtract pressure gradient (projection)
      if (programs.projection) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.write.framebuffer);
        gl.useProgram(programs.projection.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.projection.uniforms['u_velocityTexture'], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fbos.pressure.read.texture);
        gl.uniform1i(programs.projection.uniforms['u_pressureTexture'], 1);
        gl.uniform2f(programs.projection.uniforms['u_texelSize'], ...texelSize);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.projection.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        fbos.velocity.swap();
      }

      // 8. Final boundary enforcement
      if (programs.boundary) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.write.framebuffer);
        gl.useProgram(programs.boundary.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.velocity.read.texture);
        gl.uniform1i(programs.boundary.uniforms['u_velocityTexture'], 0);
        gl.uniform2f(programs.boundary.uniforms['u_resolution'], width, height);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.boundary.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        fbos.velocity.swap();
      }

      // 9. Display dye to screen
      if (programs.display) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(programs.display.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbos.dye.read.texture);
        gl.uniform1i(programs.display.uniforms['u_texture'], 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        const posLoc = programs.display.attributes['a_position'];
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    initialized,
    width,
    height,
    dissipation,
    velDissipation,
    splatRadius,
    splatSpeed,
    splatColor,
    buoyancy,
    jacobiIterations,
  ]);

  // Convert RGB float to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Convert hex to RGB float
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 0.4, 0.1];
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [r, g, b] = hexToRgb(e.target.value);
    setSplatColor([r, g, b, 1]);
  };

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
          ...style,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '8px 12px',
          borderRadius: '8px',
          zIndex: 10,
        }}
      >
        <label
          htmlFor="color-picker"
          style={{
            color: 'white',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            cursor: 'pointer',
          }}
        >
          Dye Color:
        </label>
        <input
          id="color-picker"
          type="color"
          value={rgbToHex(splatColor[0], splatColor[1], splatColor[2])}
          onChange={handleColorChange}
          style={{
            width: '40px',
            height: '30px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}

export default FluidSimulation;
