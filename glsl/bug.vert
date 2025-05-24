#version 300 es

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
}
