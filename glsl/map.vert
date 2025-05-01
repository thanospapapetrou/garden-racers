#version 300 es

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec4 position;
in vec3 normal;
in vec4 color;

out vec3 vertexNormal;
out vec4 vertexColor;

void main(void) {
  gl_Position = projection * inverse(camera) * model * position;
  vertexNormal = mat3(transpose(inverse(model))) * normal;
  vertexColor = color;
}
