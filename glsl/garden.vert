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
#define LONGITUDE 10 // TODO

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;
out vec3[DIRECTIONS] vertexTextureCoordinates;

uint getTerrain(const in int latitude, const in int longitude) { // TODO use map texture
    return uint((latitude * LONGITUDE + longitude) % TERRAINS);
}

vec3 getTextureCoordinates(const in uint terrain, const in float s, const in float t, const in float p) {
    return vec3((float(terrain) + s) / float(TERRAINS), t, p);
}

vec3[DIRECTIONS] calculateTextureCoordinates(const in int latitude, const in int longitude) {
    vec3[DIRECTIONS] coordinates;
    uint terrain = getTerrain(latitude, longitude);
    uint north = getTerrain(latitude + 1, longitude);
    uint northeast = getTerrain(latitude + 1, longitude + 1);
    uint east = getTerrain(latitude, longitude + 1);
    switch (gl_VertexID % DIRECTIONS) {
    case CENTER:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.5, 0.5, 0.25);
        coordinates[NORTH] = getTextureCoordinates(north, 0.5, 1.0, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 1.0, 0.25);
        coordinates[EAST] = getTextureCoordinates(east, 0.0, 0.5, 0.25);
        break;
    case NORTH:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.5, 0.25, 0.25);
        coordinates[NORTH] = getTextureCoordinates(north, 0.5, 0.75, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 0.75, 0.25);
        coordinates[EAST] = getTextureCoordinates(east, 0.0, 0.25, 0.25);
        break;
    case NORTHEAST:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.75, 0.25, 0.25);
        coordinates[NORTH] = getTextureCoordinates(north, 0.75, 0.75, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.25, 0.75, 0.25);
        coordinates[EAST] = getTextureCoordinates(east, 0.25, 0.25, 0.25);
        break;
    case EAST:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.75, 0.5, 0.25);
        coordinates[NORTH] = getTextureCoordinates(north, 0.75, 1.0, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.25, 1.0, 0.25);
        coordinates[EAST] = getTextureCoordinates(east, 0.25, 0.50, 0.25);
        break;
    case SOUTHEAST:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.75, 0.75, 0.5);
        coordinates[NORTH] = getTextureCoordinates(north, 0.0, 0.0, 0.0);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(east, 0.25, 0.75, 0.5);
        break;
    case SOUTH:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.5, 0.75, 0.5);
        coordinates[NORTH] = getTextureCoordinates(north, 0.0, 0.0, 0.0);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(east, 0.0, 0.75, 0.5);
        break;
    case SOUTHWEST:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.25, 0.75, 1.0);
        coordinates[NORTH] = getTextureCoordinates(north, 0.0, 0.0, 0.0);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(east, 0.0, 0.00, 0.0);
        break;
    case WEST:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.25, 0.5, 0.5);
        coordinates[NORTH] = getTextureCoordinates(north, 0.25, 1.0, 0.5);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(east, 0.0, 0.00, 0.0);
        break;
    case NORTHWEST:
        coordinates[CENTER] = getTextureCoordinates(terrain, 0.25, 0.25, 0.5);
        coordinates[NORTH] = getTextureCoordinates(north, 0.25, 0.75, 0.5);
        coordinates[NORTHEAST] = getTextureCoordinates(northeast, 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(east, 0.0, 0.00, 0.0);
        break;
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    int latitude = gl_VertexID / DIRECTIONS / LONGITUDE;
    int longitude = gl_VertexID / DIRECTIONS % LONGITUDE;
    vertexTextureCoordinates = calculateTextureCoordinates(latitude, longitude);
}
