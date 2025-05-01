#version 300 es

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

out vec3 vertexNormal;

void main(void) {
    vec4 position;
    if (gl_VertexID == 0) {
        position = vec4(float(gl_InstanceID), 0.0, 0.0, 1.0);
    } else if (gl_VertexID == 1) {
        position = vec4(float(gl_InstanceID + 1), 0.0, 0.0, 1.0);
    } else if (gl_VertexID == 2) {
        position = vec4(float(gl_InstanceID), 0.0, -1.0, 1.0);
    }
    //gl_InstanceID
    //gl_VertexID
  gl_Position = projection * inverse(camera) * model * position;
  vertexNormal = vec3(0.0, 1.0, 0.0);
}
