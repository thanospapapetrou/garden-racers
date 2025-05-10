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

vec3 foo(in int terrain, in float s, in float t, float p) { // TODO rename
    return vec3((float(terrain) + s) / float(TERRAINS), t, p);

}

vec3[DIRECTIONS] calculateTextureCoordinates() {
    vec3[DIRECTIONS] coordinates;
    float terrain = 0.0;
    float sC = (terrain + 0.5) / float(TERRAINS);
    float sE = (terrain + 0.75) / float(TERRAINS);
    float sW = (terrain + 0.25) / float(TERRAINS);
    float tC = 0.5;
    float tN = 0.25;
    float tS = 0.75;
    switch (gl_VertexID % DIRECTIONS) {
    case CENTER:
        coordinates[0] = foo(int(terrain), 0.5, 0.5, 0.5); // TODO rename and make terrain int
        coordinates[1] = foo(int(terrain) + 1, 0.5, 0.25, 0.5); // TODO rename and make terrain int
        break;
    case NORTH:
        coordinates[0] = foo(int(terrain), 0.5, 0.25, 0.5); // TODO rename and make terrain int
        coordinates[1] = foo(int(terrain) + 1, 0.5, 0.25, 0.5); // TODO rename and make terrain int
        break;
    case NORTHEAST:
        coordinates[0] = foo(int(terrain), 0.75, 0.25, 0.5); // TODO rename and make terrain int
        coordinates[1] = foo(int(terrain) + 1, 0.75, 0.25, 0.5); // TODO rename and make terrain int
        break;
    case EAST:
        coordinates[0] = vec3(sE, tC, 1.0);
        break;
    case SOUTHEAST:
        coordinates[0] = vec3(sE, tS, 1.0);
        break;
    case SOUTH:
        coordinates[0] = vec3(sC, tS, 1.0);
        break;
    case SOUTHWEST:
        coordinates[0] = vec3(sW, tS, 1.0);
        break;
    case WEST:
        coordinates[0] = vec3(sW, tC, 1.0);
        break;
    case NORTHWEST:
        coordinates[0] = vec3(sW, tN, 1.0);
        break;
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    vertexTextureCoordinates = calculateTextureCoordinates();
}
