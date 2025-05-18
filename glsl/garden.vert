#version 300 es

#define C 0
#define CENTER vec2(0.5, 0.5)
#define DIRECTIONS 9
#define E 3
#define LATTICE_STEP 0.25
#define N 1
#define NE 2
#define NW 8
#define S 5
#define SE 4
#define SW 6
#define TERRAINS 4
#define W 7

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;
uniform ivec2 latLng;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;
out vec3[DIRECTIONS] vertexTextureCoordinates;
out float test;

vec2 getDirection(const in int direction) { // TODO use static array
    switch (direction) {
    case C:
        return vec2(0.0, 0.0);
    case N:
        return vec2(0.0, -1.0);
    case NE:
        return vec2(1.0, -1.0);
    case E:
        return vec2(1.0, 0.0);
    case SE:
        return vec2(1.0, 1.0);
    case S:
        return vec2(0.0, 1.0);
    case SW:
        return vec2(-1.0, 1.0);
    case W:
        return vec2(-1.0, 0.0);
    case NW:
        return vec2(-1.0, -1.0);
    }
}

vec3[DIRECTIONS] calculateTextureCoordinates(const in ivec3 latLngDir) {
    vec3[DIRECTIONS] coordinates;
    for (int dir = 0; dir < DIRECTIONS; dir++) {
        coordinates[dir].st = CENTER + getDirection(latLngDir.z) * LATTICE_STEP;
        coordinates[dir].s /= float(TERRAINS);
        coordinates[dir].p = 1.0;
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    int latitude = gl_VertexID / DIRECTIONS / latLng.y;
    int longitude = gl_VertexID / DIRECTIONS % latLng.y;
    int direction = gl_VertexID % DIRECTIONS;
    vertexTextureCoordinates = calculateTextureCoordinates(ivec3(latitude, longitude, direction));
    test = float(latitude) / 4.0;
}
