#version 300 es

#define DIRECTIONS 8
#define TERRAINS 5

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;
in vec3 normal;
in vec3 textureCoordinates;

out vec3 vertexNormal;
out vec3 vertexTextureCoordinates;

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;

    float terrain = 1.0;
    float sC = (terrain + 0.5) / float(TERRAINS);
    float sE = (terrain + 0.75) / float(TERRAINS);
    float sW = (terrain + 0.25) / float(TERRAINS);
    float tC = 0.5;
    float tN = 0.25;
    float tS = 0.75;
    switch (gl_VertexID % (DIRECTIONS + 1)) {
    case 0: // center
        vertexTextureCoordinates = vec3(sC, tC, 1.0);
        break;
    case 1: // north
        vertexTextureCoordinates = vec3(sC, tN, 1.0);
        break;
    case 2: // northeast
    vertexTextureCoordinates = vec3(sE, tN, 1.0);
        break;
    case 3: // east
        vertexTextureCoordinates = vec3(sE, tC, 1.0);
        break;
    case 4: // southeast
        vertexTextureCoordinates = vec3(sE, tS, 1.0);
        break;
    case 5: // northeast
        vertexTextureCoordinates = vec3(sC, tS, 1.0);
        break;
    case 6: // northeast
        vertexTextureCoordinates = vec3(sW, tS, 1.0);
        break;
    case 7: // northeast
        vertexTextureCoordinates = vec3(sW, tC, 1.0);
        break;
    case 8: // northeast
        vertexTextureCoordinates = vec3(sW, tN, 1.0);
    }
}
