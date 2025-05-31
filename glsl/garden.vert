#version 300 es

uniform projectionView {
    mat4 projection;
    mat4 view;
};

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
out vec3[9] vertexTextureCoordinates;

void main(void) {
    gl_Position = projection * view * vec4(position, 1.0);
    vertexNormal = normal;
    vertexTextureCoordinates = vec3[](textureCoordinatesCenter, textureCoordinatesN, textureCoordinatesNE,
            textureCoordinatesE, textureCoordinatesSE, textureCoordinatesS,
            textureCoordinatesSW, textureCoordinatesW, textureCoordinatesNW);
}
