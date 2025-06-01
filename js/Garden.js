'use strict';

class Garden {
    static #ATTRIBUTE_NORMAL = 'normal';
    static #ATTRIBUTE_POSITION = 'position';
    static #ATTRIBUTE_TEXTURE_COORDINATES_CENTER = 'textureCoordinatesCenter';
    static #ATTRIBUTE_TEXTURE_COORDINATES_E = 'textureCoordinatesE';
    static #ATTRIBUTE_TEXTURE_COORDINATES_N = 'textureCoordinatesN';
    static #ATTRIBUTE_TEXTURE_COORDINATES_NE = 'textureCoordinatesNE';
    static #ATTRIBUTE_TEXTURE_COORDINATES_NW = 'textureCoordinatesNW';
    static #ATTRIBUTE_TEXTURE_COORDINATES_S = 'textureCoordinatesS';
    static #ATTRIBUTE_TEXTURE_COORDINATES_SE = 'textureCoordinatesSE';
    static #ATTRIBUTE_TEXTURE_COORDINATES_SW = 'textureCoordinatesSW';
    static #ATTRIBUTE_TEXTURE_COORDINATES_W = 'textureCoordinatesW';
    static #ERROR_LOADING = (url, status) => `Error loading garden ${url}: HTTP status ${status}`;
    static #IMAGE_TERRAINS = './img/terrains.png';
    static #SHADER_FRAGMENT = './glsl/garden.frag';
    static #SHADER_VERTEX = './glsl/garden.vert';
    static #STEP_LATTICE = 0.5;
    static #STEP_TEXTURE = 0.25;
    static #UBO_LIGHT = 'light';
    static #UBO_PROJECTION_VIEW = 'projectionView';
    static #UNIFORM_AMBIENT = 'ambient';
    static #UNIFORM_DIRECTIONAL_DIRECTION = 'directional.direction';
    static #UNIFORM_DIRECTIONAL_COLOR = 'directional.color';
    static #UNIFORM_PROJECTION = 'projection';
    static #UNIFORM_TERRAINS = 'terrains';
    static #UNIFORM_VIEW = 'view';
    static TEXTURES = [Garden.#IMAGE_TERRAINS];
    static UBOS = {[Garden.#UBO_PROJECTION_VIEW]: [Garden.#UNIFORM_PROJECTION, Garden.#UNIFORM_VIEW],
            [Garden.#UBO_LIGHT]: [Garden.#UNIFORM_AMBIENT, Garden.#UNIFORM_DIRECTIONAL_COLOR,
            Garden.#UNIFORM_DIRECTIONAL_DIRECTION]};

    #gl;
    #program;
    #ubos;
    #garden;
    #positionLattice;
    #normalLattice;
    #vao;
    #count;

    constructor(gl, url, projection) {
        this.#gl = gl;
        return (async () => {
            this.#program = new Program(gl, await new Shader(gl, gl.VERTEX_SHADER, Garden.#SHADER_VERTEX),
                    await new Shader(gl, gl.FRAGMENT_SHADER, Garden.#SHADER_FRAGMENT), [Garden.#UNIFORM_TERRAINS],
                    [Garden.#ATTRIBUTE_POSITION, Garden.#ATTRIBUTE_NORMAL, Garden.#ATTRIBUTE_TEXTURE_COORDINATES_CENTER,
                    Garden.#ATTRIBUTE_TEXTURE_COORDINATES_N, Garden.#ATTRIBUTE_TEXTURE_COORDINATES_NE,
                    Garden.#ATTRIBUTE_TEXTURE_COORDINATES_E, Garden.#ATTRIBUTE_TEXTURE_COORDINATES_SE,
                    Garden.#ATTRIBUTE_TEXTURE_COORDINATES_S, Garden.#ATTRIBUTE_TEXTURE_COORDINATES_SW,
                    Garden.#ATTRIBUTE_TEXTURE_COORDINATES_W, Garden.#ATTRIBUTE_TEXTURE_COORDINATES_NW]);
            this.#ubos = {};
            for (let i = 0; i < Object.keys(Garden.UBOS).length; i++) {
                this.#ubos[Object.keys(Garden.UBOS)[i]] = new UniformBufferObject(gl, i, this.#program.program,
                    Object.keys(Garden.UBOS)[i], Object.values(Garden.UBOS)[i]);
            }
            this.#ubos[Garden.#UBO_PROJECTION_VIEW].setUniforms({[Garden.#UNIFORM_PROJECTION]: projection});
            // TODO reuse ubos for light across programs
            const textures = {};
            for (let i = 0; i < Garden.TEXTURES.length; i++) {
                textures[Garden.TEXTURES[i]] = await new Texture(gl, i, Garden.TEXTURES[i]);
            }
            this.#gl.useProgram(this.#program.program);
            this.#gl.uniform1i(this.#program.uniforms[Garden.#UNIFORM_TERRAINS], textures[Garden.#IMAGE_TERRAINS].unit);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(Shader.#ERROR_LOADING(url, response.status));
            }
            this.#garden = await response.json();
            this.#positionLattice = this.#calculatePositionLattice();
            this.#normalLattice = this.#calculateNormalLattice();
            this.#vao = new VertexArrayObject(gl, Object.entries({[Garden.#ATTRIBUTE_POSITION]: this.#positions,
                    [Garden.#ATTRIBUTE_NORMAL]: this.#normals,
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_CENTER]: this.#getTextureCoordinates(null),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_N]: this.#getTextureCoordinates(Direction.N),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_NE]: this.#getTextureCoordinates(Direction.NE),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_E]: this.#getTextureCoordinates(Direction.E),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_SE]: this.#getTextureCoordinates(Direction.SE),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_S]: this.#getTextureCoordinates(Direction.S),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_SW]: this.#getTextureCoordinates(Direction.SW),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_W]: this.#getTextureCoordinates(Direction.W),
                    [Garden.#ATTRIBUTE_TEXTURE_COORDINATES_NW]: this.#getTextureCoordinates(Direction.NW)})
                    .map(([attribute, data]) => this.#getVbo(attribute, data)),
                    new VertexBufferObject(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.#indices)));
            this.#count = this.#indices.length;
            return this;
        })();
    }

    get latitude() {
        return this.#garden.latitude;
    }

    get longitude() {
        return this.#garden.longitude;
    }

    getAltitude(latitude, longitude) { // TODO improve
        return (this.#getAltitude(Math.floor(latitude), Math.floor(longitude))
                + this.#getAltitude(Math.floor(latitude), Math.ceil(longitude))
                + this.#getAltitude(Math.ceil(latitude), Math.floor(longitude))
                + this.#getAltitude(Math.ceil(latitude), Math.ceil(longitude))) / 4;
    }

    render(view, light) {
        this.#gl.useProgram(this.#program.program);
        this.#ubos[Garden.#UBO_PROJECTION_VIEW].setUniforms({[Garden.#UNIFORM_VIEW]: view});
        this.#ubos[Garden.#UBO_LIGHT].setUniforms({[Garden.#UNIFORM_AMBIENT]: new Float32Array(light.ambient),
                [Garden.#UNIFORM_DIRECTIONAL_COLOR]: new Float32Array(light.directional.color),
                [Garden.#UNIFORM_DIRECTIONAL_DIRECTION]: new Float32Array(light.directional.direction)});
        this.#gl.bindVertexArray(this.#vao.vao);
        this.#gl.drawElements(this.#gl.TRIANGLES, this.#count, this.#gl.UNSIGNED_INT, 0);
        this.#gl.bindVertexArray(null);
    }

    #getVbo(attribute, data) {
        return {vbo: new VertexBufferObject(this.#gl, this.#gl.ARRAY_BUFFER, new Float32Array(data)),
                location: this.#program.attributes[attribute], size: Vector.COMPONENTS, type: this.#gl.FLOAT};
    }

    get #positions() {
        const positions = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const lng = 2 * longitude + 1;
                const position = this.#getPosition(lat, lng);
                positions.push(position.x, position.y, position.z);
                for (let direction of Object.values(Direction)) {
                    const position = this.#getPosition(lat + direction.lat, lng + direction.lng);
                    positions.push(position.x, position.y, position.z);
                }
            }
        }
        return positions;
    }

    get #normals() {
        const normals = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                const lat = 2 * latitude + 1;
                const lng = 2 * longitude + 1;
                const normal = this.#getNormal(lat, lng);
                normals.push(normal.x, normal.y, normal.z);
                for (let direction of Object.values(Direction)) {
                    const normal = this.#getNormal(lat + direction.lat, lng + direction.lng);
                    normals.push(normal.x, normal.y, normal.z);
                }
            }
        }
        return normals;
    }

    get #indices() {
        const indices = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                for (let direction = 0; direction < Object.keys(Direction).length; direction++) {
                    const next = (direction + 1) % Object.keys(Direction).length;
                    const offset = latitude * this.#garden.longitude * (Object.keys(Direction).length + 1)
                            + longitude * (Object.keys(Direction).length + 1);
                    indices.push(offset + direction + 1, offset, offset + next + 1);
                }
            }
        }
        return indices;
    }

    #calculatePositionLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const lat = Math.floor((latitude - 1) / 2);
                const lng = Math.floor((longitude - 1) / 2);
                let directions = [null];
                let altitude = 0.0;
                if ((latitude % 2 == 1) && (longitude % 2 == 0)) {
                    directions.push(Direction.E);
                } else if ((latitude % 2 == 0) && (longitude % 2 == 1)) {
                    directions.push(Direction.N);
                } else if ((latitude % 2 == 0) && (longitude % 2 == 0)) {
                    directions.push(Direction.N, Direction.NE, Direction.E);
                }
                lattice[latitude][longitude] = new Vector(Garden.#STEP_LATTICE * longitude,
                        Garden.#STEP_LATTICE * latitude, directions
                        .map((dir) => this.#getAltitude(lat + (dir?.lat ?? 0.0), lng + (dir?.lng ?? 0.0)))
                        .reduce((a, b) => a + b, 0.0) / directions.length);
            }
        }
        return lattice;
    }

    #calculateNormalLattice() {
        const lattice = [];
        for (let latitude = 0; latitude < 2 * this.#garden.latitude + 1; latitude++) {
            lattice[latitude] = [];
            for (let longitude = 0; longitude < 2 * this.#garden.longitude + 1; longitude++) {
                const positions = [];
                for (let direction of [null, ...Object.keys(Direction)]) {
                    positions[direction] = this.#getPosition(latitude + (Direction[direction]?.lat ?? 0.0),
                            longitude + (Direction[direction]?.lng ?? 0.0));
                }
                const step = ((latitude % 2 == 1) ^ (longitude % 2 == 1)) ? 2 : 1;
                let normal = new Vector(0.0, 0.0, 0.0);
                for (let direction = 0; direction < Object.keys(Direction).length; direction += step) {
                    const dir = Object.keys(Direction)[direction];
                    const next = Object.keys(Direction)[(direction + step) % Object.keys(Direction).length];
                    normal = normal.add(this.#calculateNormal(positions[dir], positions[null], positions[next]));
                }
                lattice[latitude][longitude] = normal.normalize();
            }
        }
        return lattice;
    }

    #getTextureCoordinates(direction) {
        const coordinates = [];
        for (let latitude = 0; latitude < this.#garden.latitude; latitude++) {
            for (let longitude = 0; longitude < this.#garden.longitude; longitude++) {
                for (let dir of [null, ...Object.values(Direction)]) {
                    let s = (this.#getTerrain(latitude + (direction?.lat ?? 0), longitude + (direction?.lng ?? 0))
                            + Garden.#STEP_LATTICE + ((dir?.lng ?? 0) - 2 * (direction?.lng ?? 0))
                            * Garden.#STEP_TEXTURE) / Object.keys(Terrain).length;
                    let t = Garden.#STEP_LATTICE - ((dir?.lat ?? 0) + 2 * (direction?.lat ?? 0)) * Garden.#STEP_TEXTURE;
                    let p = Math.max(2 - Math.sqrt(Math.pow((dir?.lng ?? 0) - 2 * (direction?.lng ?? 0), 2) +
                            Math.pow((dir?.lat ?? 0) - 2 * (direction?.lat ?? 0), 2)), 0.0);
                    coordinates.push(s, t, p);
                }
            }
        }
        return coordinates;
    }

    #getAltitude(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return this.#garden.altitudes[lat * this.#garden.longitude + lng];
    }

    #getTerrain(latitude, longitude) {
        const lat = this.#garden.latitude - Math.min(Math.max(latitude, 0), this.#garden.latitude - 1) - 1;
        const lng = Math.min(Math.max(longitude, 0), this.#garden.longitude - 1);
        return Terrain[this.#garden.terrains[lat * this.#garden.longitude + lng]];
    }

    #getPosition(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return new Vector(Garden.#STEP_LATTICE * longitude, Garden.#STEP_LATTICE * latitude,
                this.#positionLattice[lat][lng].z);
    }

    #getNormal(latitude, longitude) {
        const lat = Math.min(Math.max(latitude, 0), 2 * this.#garden.latitude);
        const lng = Math.min(Math.max(longitude, 0), 2 * this.#garden.longitude);
        return this.#normalLattice[lat][lng];
    }

    #calculateNormal(a, b, c) {
        return b.subtract(a).cross(c.subtract(b)).normalize();
    }
}
