#version 300 es

#define C 0
#define CENTER vec2(0.5, 0.5)
#define DIRECTIONS ivec2[9](ivec2(0.0, 0.0), ivec2(0.0, -1.0), ivec2(1.0, -1.0), ivec2(1.0, 0.0), ivec2(1.0, 1.0), ivec2(0.0, 1.0), ivec2(-1.0, 1.0), ivec2(-1.0, 0.0), ivec2(-1.0, -1.0))
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
uniform highp isampler2D terrains;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;
out vec3[DIRECTIONS.length()] vertexTextureCoordinates;
out float test;

vec3[DIRECTIONS.length()] calculateTextureCoordinates(const in ivec3 latLngDir) {
    vec3[DIRECTIONS.length()] coordinates;
    for (int dir = 0; dir < DIRECTIONS.length(); dir++) {
        ivec2 ll = latLngDir.xy + DIRECTIONS[dir]; // TODO rename
        int terrain = texelFetch(terrains, ivec2(ll.x * latLng.y + ll.y, 0), 0).r;
        coordinates[dir].st = CENTER + vec2(DIRECTIONS[latLngDir.z]) * LATTICE_STEP
                - vec2(DIRECTIONS[dir]) * 2.0 * LATTICE_STEP;
        coordinates[dir].p = max(length(vec2(1.0, 1.0) * 2.0 * LATTICE_STEP) - length(vec2(DIRECTIONS[latLngDir.z]) - 4.0 * vec2(DIRECTIONS[dir])) * LATTICE_STEP, 0.0);
        coordinates[dir].st += vec2(float(terrain), 0.0);
        coordinates[dir].s /= float(TERRAINS);
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    int latitude = gl_VertexID / DIRECTIONS.length() / latLng.y;
    int longitude = gl_VertexID / DIRECTIONS.length() % latLng.y;
    int direction = gl_VertexID % DIRECTIONS.length();
    vertexTextureCoordinates = calculateTextureCoordinates(ivec3(latitude, longitude, direction));
    test = float(texelFetch(terrains, ivec2(latitude * latLng.y + longitude, 0), 0).r) / 4.0;
}
