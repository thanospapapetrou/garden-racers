#version 300 es

#define DIRECTIONS 9
#define LATITUDE 5
#define LONGITUDE 10 // TODO uniforms

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model;
uniform sampler2D textureCoordinates;

in vec3 position;
in vec3 normal;

out vec3 vertexNormal;
out vec3[DIRECTIONS] vertexTextureCoordinates;

vec3[DIRECTIONS] calculateTextureCoordinates(const in ivec3 latLngDir) {
    vec3[DIRECTIONS] coordinates;
    for (int dir = 0; dir < DIRECTIONS; dir++) {
        coordinates[dir] = texture(textureCoordinates, vec2((float(latLngDir.x * LONGITUDE * DIRECTIONS * DIRECTIONS
                + latLngDir.y * DIRECTIONS * DIRECTIONS + latLngDir.z * DIRECTIONS + dir) + 0.5) / float(LATITUDE
                * LONGITUDE * DIRECTIONS * DIRECTIONS), 0.5)).stp;
        // TODO fix
        coordinates[dir].s += 0.1;
        coordinates[dir].t = 0.5;
        coordinates[dir].p = 1.0;
    }
    return coordinates;
}

void main(void) {
    gl_Position = projection * inverse(camera) * model * vec4(position, 1.0);
    vertexNormal = mat3(transpose(inverse(model))) * normal;
    vertexTextureCoordinates = calculateTextureCoordinates(ivec3(gl_VertexID / DIRECTIONS / LONGITUDE,
            gl_VertexID / DIRECTIONS % LONGITUDE, gl_VertexID % DIRECTIONS));
}
