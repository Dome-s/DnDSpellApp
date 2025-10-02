// Basic vertex shader used for all passes
export const baseVertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Splat shader - adds dye and velocity on mouse input
export const splatShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_dyeTexture;
uniform sampler2D u_velocityTexture;
uniform vec2 u_splatPos;
uniform float u_splatRadius;
uniform vec4 u_splatColor;
uniform vec2 u_splatForce;
uniform int u_texType; // 0 = dye, 1 = velocity

out vec4 fragColor;

float falloff(vec2 uv, vec2 center, float radius) {
    float d = distance(uv, center);
    return smoothstep(radius, 0.0, d);
}

void main() {
    float w = falloff(v_uv, u_splatPos, u_splatRadius);

    if (u_texType == 0) {
        // Dye - reduced intensity and capped to prevent infinite accumulation
        vec4 dye = texture(u_dyeTexture, v_uv);
        fragColor = min(dye + u_splatColor * w * 0.3, vec4(1.0));
    } else {
        // Velocity
        vec2 vel = texture(u_velocityTexture, v_uv).xy;
        fragColor = vec4(vel + u_splatForce * w, 0.0, 1.0);
    }
}
`;

// Advect dye shader
export const advectDyeShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_dyeTexture;
uniform sampler2D u_velocityTexture;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform float u_dissipation;

out vec4 fragColor;

void main() {
    vec2 velocity = texture(u_velocityTexture, v_uv).xy;

    // Semi-Lagrangian advection: trace backwards
    vec2 prevUV = v_uv - velocity * u_dt * u_texelSize;

    // Sample dye from previous position
    vec4 dyePrev = texture(u_dyeTexture, prevUV);

    // Apply dissipation
    float decay = exp(-u_dissipation * u_dt);
    fragColor = dyePrev * decay;
}
`;

// Advect velocity shader
export const advectVelocityShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocityTexture;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform float u_velDissipation;

out vec4 fragColor;

void main() {
    vec2 velocity = texture(u_velocityTexture, v_uv).xy;

    // Self-advection: velocity advected by itself
    vec2 prevUV = v_uv - velocity * u_dt * u_texelSize;
    vec2 velPrev = texture(u_velocityTexture, prevUV).xy;

    // Apply dissipation
    float decay = exp(-u_velDissipation * u_dt);
    fragColor = vec4(velPrev * decay, 0.0, 1.0);
}
`;

// Divergence shader
export const divergenceShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocityTexture;
uniform vec2 u_texelSize;

out vec4 fragColor;

void main() {
    // Sample neighbors
    vec2 vL = texture(u_velocityTexture, v_uv - vec2(u_texelSize.x, 0.0)).xy;
    vec2 vR = texture(u_velocityTexture, v_uv + vec2(u_texelSize.x, 0.0)).xy;
    vec2 vB = texture(u_velocityTexture, v_uv - vec2(0.0, u_texelSize.y)).xy;
    vec2 vT = texture(u_velocityTexture, v_uv + vec2(0.0, u_texelSize.y)).xy;

    // Compute divergence using central differences
    float div = 0.5 * ((vR.x - vL.x) + (vT.y - vB.y));

    fragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

// Jacobi pressure solver shader
export const jacobiShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_pressureTexture;
uniform sampler2D u_divergenceTexture;
uniform vec2 u_texelSize;

out vec4 fragColor;

void main() {
    // Sample pressure from neighbors
    float pL = texture(u_pressureTexture, v_uv - vec2(u_texelSize.x, 0.0)).r;
    float pR = texture(u_pressureTexture, v_uv + vec2(u_texelSize.x, 0.0)).r;
    float pB = texture(u_pressureTexture, v_uv - vec2(0.0, u_texelSize.y)).r;
    float pT = texture(u_pressureTexture, v_uv + vec2(0.0, u_texelSize.y)).r;

    float div = texture(u_divergenceTexture, v_uv).r;
    float pOld = texture(u_pressureTexture, v_uv).r;

    // Jacobi iteration
    float pNew = (pL + pR + pB + pT - div) * 0.25;

    // SOR relaxation (80% new, 20% old)
    float pressure = mix(pOld, pNew, 0.8);

    fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

// Subtract pressure gradient (projection) shader
export const projectionShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocityTexture;
uniform sampler2D u_pressureTexture;
uniform vec2 u_texelSize;

out vec4 fragColor;

void main() {
    // Sample pressure from neighbors
    float pL = texture(u_pressureTexture, v_uv - vec2(u_texelSize.x, 0.0)).r;
    float pR = texture(u_pressureTexture, v_uv + vec2(u_texelSize.x, 0.0)).r;
    float pB = texture(u_pressureTexture, v_uv - vec2(0.0, u_texelSize.y)).r;
    float pT = texture(u_pressureTexture, v_uv + vec2(0.0, u_texelSize.y)).r;

    // Compute pressure gradient
    vec2 gradP = 0.5 * vec2(pR - pL, pT - pB);

    // Subtract from velocity
    vec2 velocity = texture(u_velocityTexture, v_uv).xy;
    velocity -= gradP;

    fragColor = vec4(velocity, 0.0, 1.0);
}
`;

// Buoyancy shader
export const buoyancyShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocityTexture;
uniform sampler2D u_dyeTexture;
uniform float u_buoyancy;
uniform float u_ambientDensity;
uniform float u_dt;

out vec4 fragColor;

void main() {
    vec4 dye = texture(u_dyeTexture, v_uv);
    // Use luminance of RGB as density (how much dye is present)
    float density = dot(dye.rgb, vec3(0.299, 0.587, 0.114));

    // Apply vertical force proportional to density difference
    float force = (density - u_ambientDensity) * u_buoyancy;

    vec2 velocity = texture(u_velocityTexture, v_uv).xy;
    velocity.y += force * u_dt;

    fragColor = vec4(velocity, 0.0, 1.0);
}
`;

// Boundary conditions shader (free-slip)
export const boundaryShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_velocityTexture;
uniform vec2 u_resolution;

out vec4 fragColor;

void main() {
    vec2 pixel = v_uv * u_resolution;
    vec2 velocity = texture(u_velocityTexture, v_uv).xy;

    // Free-slip boundaries: zero normal component at edges
    if (pixel.x < 1.0 || pixel.x > u_resolution.x - 1.0) {
        velocity.x = 0.0;
    }
    if (pixel.y < 1.0 || pixel.y > u_resolution.y - 1.0) {
        velocity.y = 0.0;
    }

    fragColor = vec4(velocity, 0.0, 1.0);
}
`;

// Display shader - visualizes the dye
export const displayShader = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
    fragColor = texture(u_texture, v_uv);
}
`;
