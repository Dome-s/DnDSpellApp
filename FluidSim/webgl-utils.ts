// WebGL utility functions for fluid simulation

export interface ShaderProgram {
  program: WebGLProgram;
  uniforms: { [key: string]: WebGLUniformLocation | null };
  attributes: { [key: string]: number };
}

export interface FramebufferObject {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export interface DoubleFBO {
  read: FramebufferObject;
  write: FramebufferObject;
}

// Compile a shader
export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Create a shader program
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: string,
  fragmentShader: string
): ShaderProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  // Get all active uniforms
  const uniforms: { [key: string]: WebGLUniformLocation | null } = {};
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < numUniforms; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) {
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
  }

  // Get all active attributes
  const attributes: { [key: string]: number } = {};
  const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < numAttributes; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (info) {
      attributes[info.name] = gl.getAttribLocation(program, info.name);
    }
  }

  return { program, uniforms, attributes };
}

// Create a texture
export function createTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat: number = gl.RGBA16F,
  format: number = gl.RGBA,
  type: number = gl.FLOAT
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

  return texture;
}

// Create a framebuffer with attached texture
export function createFBO(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat: number = gl.RGBA16F,
  format: number = gl.RGBA,
  type: number = gl.FLOAT
): FramebufferObject | null {
  const texture = createTexture(gl, width, height, internalFormat, format, type);
  if (!texture) return null;

  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) return null;

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer incomplete:', status);
    return null;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture, width, height };
}

// Create a double framebuffer (ping-pong)
export function createDoubleFBO(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  internalFormat: number = gl.RGBA16F,
  format: number = gl.RGBA,
  type: number = gl.FLOAT
): DoubleFBO | null {
  const read = createFBO(gl, width, height, internalFormat, format, type);
  const write = createFBO(gl, width, height, internalFormat, format, type);

  if (!read || !write) return null;

  return {
    read,
    write,
    swap() {
      const temp = this.read;
      this.read = this.write;
      this.write = temp;
    }
  } as DoubleFBO & { swap: () => void };
}

// Create a fullscreen quad
export function createQuad(gl: WebGL2RenderingContext): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return buffer;
}

// Clear a framebuffer
export function clearFBO(
  gl: WebGL2RenderingContext,
  fbo: FramebufferObject,
  r: number = 0,
  g: number = 0,
  b: number = 0,
  a: number = 0
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// Blit (copy) one texture to another using a shader
export function blit(
  gl: WebGL2RenderingContext,
  target: FramebufferObject | null,
  source: WebGLTexture,
  program: ShaderProgram,
  quad: WebGLBuffer
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
  gl.useProgram(program.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, source);
  gl.uniform1i(program.uniforms['u_texture'], 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  const posLoc = program.attributes['a_position'];
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Check for floating-point texture support and determine best format
export function checkFloatTextureSupport(gl: WebGL2RenderingContext): {
  supported: boolean;
  internalFormat: number;
  format: number;
  type: number;
} {
  // Enable necessary extensions
  gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');

  // Try RGBA16F first (best quality)
  let testTexture = createTexture(gl, 2, 2, gl.RGBA16F, gl.RGBA, gl.FLOAT);
  if (testTexture) {
    const testFBO = gl.createFramebuffer();
    if (testFBO) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, testFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, testTexture, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(testFBO);
        gl.deleteTexture(testTexture);
        console.log('Using RGBA16F float textures');
        return {
          supported: true,
          internalFormat: gl.RGBA16F,
          format: gl.RGBA,
          type: gl.FLOAT
        };
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(testFBO);
    }
    gl.deleteTexture(testTexture);
  }

  // Try RGBA32F as fallback
  testTexture = createTexture(gl, 2, 2, gl.RGBA32F, gl.RGBA, gl.FLOAT);
  if (testTexture) {
    const testFBO = gl.createFramebuffer();
    if (testFBO) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, testFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, testTexture, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(testFBO);
        gl.deleteTexture(testTexture);
        console.log('Using RGBA32F float textures');
        return {
          supported: true,
          internalFormat: gl.RGBA32F,
          format: gl.RGBA,
          type: gl.FLOAT
        };
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(testFBO);
    }
    gl.deleteTexture(testTexture);
  }

  // Last resort: use half-float (HALF_FLOAT)
  testTexture = createTexture(gl, 2, 2, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
  if (testTexture) {
    const testFBO = gl.createFramebuffer();
    if (testFBO) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, testFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, testTexture, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(testFBO);
        gl.deleteTexture(testTexture);
        console.log('Using RGBA16F half-float textures');
        return {
          supported: true,
          internalFormat: gl.RGBA16F,
          format: gl.RGBA,
          type: gl.HALF_FLOAT
        };
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(testFBO);
    }
    gl.deleteTexture(testTexture);
  }

  console.error('No suitable float texture format found');
  return {
    supported: false,
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE
  };
}
