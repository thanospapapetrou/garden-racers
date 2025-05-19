#version 300 es

#define DIRECTIONS 9

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;
in vec3 normal;
in vec3 textureCoordinatesCenter;
in vec3 textureCoordinatesN;
in vec3 textureCoordinatesNE;
in vec3 textureCoordinatesE;
in vec3 textureCoordinatesSE;
in vec3 textureCoordinatesS;
in vec3 textureCoordinatesSW;
in vec3 textureCoordinatesW;
in vec3 textureCoordinatesNW;

out vec3 vertexNormal;
out vec3[DIRECTIONS] vertexTextureCoordinates;
out float test;

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    vertexTextureCoordinates[0] = textureCoordinatesCenter;
    vertexTextureCoordinates[1] = textureCoordinatesN;
    vertexTextureCoordinates[2] = textureCoordinatesNE;
    vertexTextureCoordinates[3] = textureCoordinatesE;
    vertexTextureCoordinates[4] = textureCoordinatesSE;
    vertexTextureCoordinates[5] = textureCoordinatesS;
    vertexTextureCoordinates[6] = textureCoordinatesSW;
    vertexTextureCoordinates[7] = textureCoordinatesW;
    vertexTextureCoordinates[8] = textureCoordinatesNW;
    test = 0.0;
}
