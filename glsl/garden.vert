#version 300 es

#define CENTER 0
#define NORTH 1
#define NORTHEAST 2
#define EAST 3
#define SOUTHEAST 4
#define SOUTH 5
#define SOUTHWEST 6
#define WEST 7
#define NORTHWEST 8
#define DIRECTIONS 9
#define TERRAINS 5

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;
out vec3[DIRECTIONS] vertexTextureCoordinates;

vec3 getTextureCoordinates(in int terrain, in float s, in float t, float p) { // TODO rename
    return vec3((float(terrain) + s) / float(TERRAINS), t, p);
}

vec3[DIRECTIONS] calculateTextureCoordinates() {
    vec3[DIRECTIONS] coordinates;
    int terrain = 3;
    int next = 4;
    switch (gl_VertexID % DIRECTIONS) {
    case CENTER:
        coordinates[0] = getTextureCoordinates(terrain, 0.5, 0.5, 1.0);
        // coordinates[1] = getTextureCoordinates(next, 0.5, 0.25, 0.5); // TODO rename and make terrain int
        break;
    case NORTH:
        coordinates[0] = getTextureCoordinates(terrain, 0.5, 0.25, 1.0);
        // coordinates[1] = getTextureCoordinates(next, 0.5, 0.75, 0.5); // TODO rename and make terrain int
        break;
    case NORTHEAST:
        coordinates[0] = getTextureCoordinates(terrain, 0.75, 0.25, 1.0);
        // coordinates[1] = getTextureCoordinates(next, 0.75, 0.25, 0.5); // TODO rename and make terrain int
        break;
    case EAST:
        coordinates[0] = getTextureCoordinates(terrain, 0.75, 0.5, 1.0);
        break;
    case SOUTHEAST:
        coordinates[0] = getTextureCoordinates(terrain, 0.75, 0.75, 1.0);
        break;
    case SOUTH:
        coordinates[0] = getTextureCoordinates(terrain, 0.5, 0.75, 1.0);
        break;
    case SOUTHWEST:
        coordinates[0] = getTextureCoordinates(terrain, 0.25, 0.75, 1.0);
        break;
    case WEST:
        coordinates[0] = getTextureCoordinates(terrain, 0.25, 0.5, 1.0);
        break;
    case NORTHWEST:
        coordinates[0] = getTextureCoordinates(terrain, 0.25, 0.25, 1.0);
        break;
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    vertexTextureCoordinates = calculateTextureCoordinates();
}
