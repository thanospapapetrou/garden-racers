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
#define LATITUDE 5
#define LONGITUDE 10 // TODO

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;
out vec3[DIRECTIONS] vertexTextureCoordinates;

ivec2 getDirection(const in int direction) {
    switch (direction) {
    case CENTER:
        return ivec2(0, 0);
    case NORTH:
        return ivec2(1, 0);
    case NORTHEAST:
        return ivec2(1, 0);
    case EAST:
        return ivec2(0, 1);
    case SOUTHEAST:
        return ivec2(-1, 1);
    case SOUTH:
        return ivec2(-1, 0);
    case SOUTHWEST:
        return ivec2(-1, -1);
    case WEST:
        return ivec2(0, -1);
    case NORTHWEST:
        return ivec2(1, -1);
    }
}

int getTerrain(const in ivec2 latitudeLongitude) { // TODO use map texture
    int lat = min(max(latitudeLongitude.x, 0), LATITUDE - 1);
    int lng = min(max(latitudeLongitude.y, 0), LONGITUDE - 1);
    return (lat * LONGITUDE + lng) % TERRAINS;
}

vec3 getTextureCoordinates(const in int terrain, const in float s, const in float t, const in float p) { // TODO replace last 3 floats with vec3
    return vec3((float(terrain) + s) / float(TERRAINS), t, p);
}

vec3[DIRECTIONS] calculateTextureCoordinates(const in ivec2 latitudeLongitude, const in int direction) {
    vec3[DIRECTIONS] coordinates;
    int[DIRECTIONS] terrains;
    for (int dir = 0; dir < DIRECTIONS; dir++) {
        terrains[dir] = getTerrain(latitudeLongitude + getDirection(dir));
    }
    switch (direction) {
    case CENTER:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.5, 0.5, 0.25);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.5, 1.0, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 1.0, 0.25);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.0, 0.5, 0.25);
        break;
    case NORTH:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.5, 0.25, 0.25);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.5, 0.75, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 0.75, 0.25);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.0, 0.25, 0.25);
        break;
    case NORTHEAST:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.75, 0.25, 0.25);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.75, 0.75, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.25, 0.75, 0.25);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.25, 0.25, 0.25);
        break;
    case EAST:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.75, 0.5, 0.25);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.75, 1.0, 0.25);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.25, 1.0, 0.25);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.25, 0.50, 0.25);
        break;
    case SOUTHEAST:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.75, 0.75, 0.5);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.0, 0.0, 0.0);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.25, 0.75, 0.5);
        break;
    case SOUTH:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.5, 0.75, 0.5);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.0, 0.0, 0.0);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.0, 0.75, 0.5);
        break;
    case SOUTHWEST:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.25, 0.75, 1.0);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.0, 0.0, 0.0);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.0, 0.00, 0.0);
        break;
    case WEST:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.25, 0.5, 0.5);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.25, 1.0, 0.5);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.0, 0.00, 0.0);
        break;
    case NORTHWEST:
        coordinates[CENTER] = getTextureCoordinates(terrains[CENTER], 0.25, 0.25, 0.5);
        coordinates[NORTH] = getTextureCoordinates(terrains[NORTH], 0.25, 0.75, 0.5);
        coordinates[NORTHEAST] = getTextureCoordinates(terrains[NORTHEAST], 0.0, 0.0, 0.0);
        coordinates[EAST] = getTextureCoordinates(terrains[EAST], 0.0, 0.00, 0.0);
        break;
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    ivec2 latitudeLongitude = ivec2(gl_VertexID / DIRECTIONS / LONGITUDE, gl_VertexID / DIRECTIONS % LONGITUDE);
    int direction = gl_VertexID % DIRECTIONS;
    vertexTextureCoordinates = calculateTextureCoordinates(latitudeLongitude, direction);
}
