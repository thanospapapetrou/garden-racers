#version 300 es

uniform projectionViewModel {
    mat4 projection;
    mat4 view;
    mat4 model;
};

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;

void main(void) {
    gl_Position = projection * view * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
}
