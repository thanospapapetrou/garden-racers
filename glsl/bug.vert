#version 300 es

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;

void main(void) {
    gl_Position = projection * view * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
}
