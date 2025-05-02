#version 300 es

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;

out vec3 vertexNormal;
out vec4 vertexColor;

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = vec3(0.0, 1.0, 0.0); // TODO up
    switch (gl_VertexID % 7) {
    case 0:
        vertexColor = vec4(1.0, 0.0, 0.0, 1.0); // TODO red
        break;
    case 1:
        vertexColor = vec4(0.0, 1.0, 0.0, 1.0); // TODO green
        break;
    case 2:
        vertexColor = vec4(0.0, 0.0, 1.0, 1.0); // TODO blue
        break;
    case 3:
        vertexColor = vec4(1.0, 1.0, 0.0, 1.0); // TODO yellow
        break;
    case 4:
        vertexColor = vec4(1.0, 0.0, 1.0, 1.0); // TODO magenta
        break;
    case 5:
        vertexColor = vec4(0.0, 1.0, 1.0, 1.0); // TODO teal
        break;
    case 6:
        vertexColor = vec4(1.0, 1.0, 1.0, 1.0); // TODO white
    }
}
